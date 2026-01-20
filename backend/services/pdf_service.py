"""
PDF Service - Core PDF manipulation logic using PyMuPDF
"""
import fitz  # PyMuPDF
import hashlib


def place_anchors_on_pdf(pdf_bytes: bytes, anchors: list, canvas_width: int, canvas_height: int, preview: bool = False) -> bytes:
    """
    Place anchor text on PDF at specified coordinates.
    
    Args:
        pdf_bytes: PDF file as bytes
        anchors: List of anchor dictionaries with text, x, y, page
        canvas_width: Width of canvas when anchors were placed
        canvas_height: Height of canvas when anchors were placed
        preview: If True, use red text for visibility. If False, use white text for clean output.
    
    Returns:
        Modified PDF as bytes
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total_pages = len(doc)
    
    # Color: Red for preview (visible), White for final (clean/invisible)
    text_color = (1, 0, 0) if preview else (1, 1, 1)  # RGB: Red or White
    
    for anchor in anchors:
        pages = determine_pages(anchor.get('page', '1'), total_pages)
        
        for page_num in pages:
            if page_num < 1 or page_num > total_pages:
                continue
                
            page = doc[page_num - 1]  # 0-indexed
            
            # Get anchor canvas dimensions (use provided or from anchor itself)
            anchor_canvas_width = anchor.get('canvasWidth') or canvas_width
            anchor_canvas_height = anchor.get('canvasHeight') or canvas_height
            
            # Convert coordinates from canvas to PDF coordinate system
            pdf_x, pdf_y = convert_coordinates(
                anchor.get('x', 0),
                anchor.get('y', 0),
                anchor_canvas_width,
                anchor_canvas_height,
                page.rect.width,
                page.rect.height
            )
            
            # Insert text at calculated position
            page.insert_text(
                (pdf_x, pdf_y),
                anchor.get('text', ''),
                fontsize=10,
                color=text_color
            )
    
    # Return modified PDF as bytes
    return doc.tobytes()


def determine_pages(page_setting: str, total_pages: int) -> list:
    """
    Determine which pages to apply anchor to.
    
    Args:
        page_setting: "global", "last", or comma-separated page numbers
        total_pages: Total number of pages in PDF
    
    Returns:
        List of page numbers (1-indexed)
    """
    if not page_setting:
        return [1]
    
    page_setting = str(page_setting).lower().strip()
    
    if page_setting == 'global':
        # All pages
        return list(range(1, total_pages + 1))
    elif page_setting == 'last':
        # Last page only
        return [total_pages]
    else:
        # Parse comma-separated page numbers
        try:
            pages = []
            for p in page_setting.split(','):
                p = p.strip()
                if p.isdigit():
                    page_num = int(p)
                    if 1 <= page_num <= total_pages:
                        pages.append(page_num)
            return pages if pages else [1]
        except (ValueError, AttributeError):
            return [1]


def convert_coordinates(canvas_x: int, canvas_y: int, 
                       canvas_width: int, canvas_height: int,
                       pdf_width: float, pdf_height: float) -> tuple:
    """
    Convert canvas coordinates to PDF coordinates for PyMuPDF.
    
    PyMuPDF insert_text uses TOP-LEFT origin (same as canvas).
    Both coordinate systems: Origin at top-left, Y increases downward.
    
    Args:
        canvas_x: X coordinate on canvas
        canvas_y: Y coordinate on canvas
        canvas_width: Canvas width (from frontend)
        canvas_height: Canvas height (from frontend)
        pdf_width: PDF page width (in points)
        pdf_height: PDF page height (in points)
    
    Returns:
        Tuple of (pdf_x, pdf_y)
    """
    # Avoid division by zero
    if canvas_width <= 0 or canvas_height <= 0:
        return (0, 0)
    
    # Calculate scale factors
    scale_x = pdf_width / canvas_width
    scale_y = pdf_height / canvas_height
    
    # Convert coordinates (both systems use top-left origin)
    pdf_x = canvas_x * scale_x
    pdf_y = canvas_y * scale_y  # NO flip needed - PyMuPDF uses top-left origin
    
    return (pdf_x, pdf_y)


def get_pdf_page_count(pdf_bytes: bytes) -> int:
    """Get the number of pages in a PDF."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    return len(doc)


def get_pdf_content_hash(pdf_bytes: bytes) -> str:
    """
    Generate a SHA-256 hash of the PDF content.
    Used to detect duplicate PDF uploads.
    
    Args:
        pdf_bytes: PDF file as bytes
    
    Returns:
        SHA-256 hash string
    """
    return hashlib.sha256(pdf_bytes).hexdigest()


def get_pdf_text_hash(pdf_bytes: bytes) -> str:
    """
    Generate a hash based on the text content of the PDF.
    More reliable for detecting "same" PDFs even if metadata differs.
    
    Args:
        pdf_bytes: PDF file as bytes
    
    Returns:
        SHA-256 hash of extracted text
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    all_text = ""
    for page in doc:
        all_text += page.get_text()
    return hashlib.sha256(all_text.encode()).hexdigest()


def render_page_as_image(pdf_bytes: bytes, page_num: int, dpi: int = 150) -> bytes:
    """
    Render a PDF page as a PNG image.
    
    Args:
        pdf_bytes: PDF file as bytes
        page_num: Page number (1-indexed)
        dpi: Resolution for rendering
    
    Returns:
        PNG image as bytes
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    
    if page_num < 1 or page_num > len(doc):
        raise ValueError(f"Page {page_num} not found in PDF")
    
    page = doc[page_num - 1]
    
    # Render page to image
    mat = fitz.Matrix(dpi / 72, dpi / 72)  # Scale for DPI
    pix = page.get_pixmap(matrix=mat)
    
    return pix.tobytes("png")
