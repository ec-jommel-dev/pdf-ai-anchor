"""
PDF Routes - Upload, download, and manage multiple PDFs per provider
Each PDF has its own anchor settings
"""
import os
from flask import Blueprint, request, jsonify, send_file, current_app
from werkzeug.utils import secure_filename
from database import db
from models import Provider, ProviderPDF
from services.pdf_service import get_pdf_page_count, render_page_as_image, get_pdf_content_hash
import io

pdfs_bp = Blueprint('pdfs', __name__)

ALLOWED_EXTENSIONS = {'pdf'}


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ============ LIST PDFs FOR PROVIDER ============

@pdfs_bp.route('/providers/<int:provider_id>/pdfs', methods=['GET'])
def list_pdfs(provider_id):
    """List all PDFs for a provider"""
    provider = Provider.query.get_or_404(provider_id)
    
    # Filter by active status (soft delete)
    include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
    
    if include_inactive:
        pdfs = provider.pdfs
    else:
        pdfs = [pdf for pdf in provider.pdfs if pdf.is_active]
    
    return jsonify([pdf.to_dict() for pdf in pdfs])


# ============ UPLOAD NEW PDF ============

@pdfs_bp.route('/providers/<int:provider_id>/pdfs', methods=['POST'])
def upload_pdf(provider_id):
    """Upload a new PDF for provider (supports multiple PDFs)"""
    provider = Provider.query.get_or_404(provider_id)
    
    if 'pdf' not in request.files:
        return jsonify({'error': 'No PDF file provided'}), 400
    
    file = request.files['pdf']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Only PDF files are allowed'}), 400
    
    # Read PDF bytes for hash and page count
    pdf_bytes = file.read()
    file.seek(0)  # Reset file pointer
    
    # Generate content hash for duplicate detection
    content_hash = get_pdf_content_hash(pdf_bytes)
    
    # Check for duplicate PDF within SAME provider
    existing_pdf = ProviderPDF.query.filter_by(
        provider_id=provider_id, 
        content_hash=content_hash,
        is_active=True
    ).first()
    
    if existing_pdf:
        return jsonify({
            'warning': 'duplicate_found',
            'message': f'This PDF is already uploaded as: {existing_pdf.filename}',
            'existingPdfId': existing_pdf.id,
            'existingFilename': existing_pdf.filename
        }), 409  # Conflict
    
    # Secure the filename
    original_filename = secure_filename(file.filename)
    
    # Create uploads directory if it doesn't exist
    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    
    # Create unique filename with provider ID and timestamp
    import time
    timestamp = int(time.time())
    unique_filename = f"provider_{provider_id}_{timestamp}_{original_filename}"
    file_path = os.path.join(upload_folder, unique_filename)
    
    # Save file
    file.save(file_path)
    
    # Get file info
    file_size = os.path.getsize(file_path)
    total_pages = get_pdf_page_count(pdf_bytes)
    
    # Get canvas dimensions from request (for coordinate conversion)
    canvas_width = request.form.get('canvasWidth', type=int)
    canvas_height = request.form.get('canvasHeight', type=int)
    
    # Create database record
    provider_pdf = ProviderPDF(
        provider_id=provider.id,
        filename=original_filename,
        file_path=file_path,
        file_size=file_size,
        total_pages=total_pages,
        canvas_width=canvas_width,
        canvas_height=canvas_height,
        content_hash=content_hash,
        is_active=True
    )
    
    db.session.add(provider_pdf)
    db.session.commit()
    
    return jsonify(provider_pdf.to_dict()), 201


# ============ GET SINGLE PDF ============

@pdfs_bp.route('/pdfs/<int:pdf_id>', methods=['GET'])
def get_pdf(pdf_id):
    """Download a specific PDF by ID"""
    provider_pdf = ProviderPDF.query.get_or_404(pdf_id)
    
    if not os.path.exists(provider_pdf.file_path):
        return jsonify({'error': 'PDF file not found on disk'}), 404
    
    return send_file(
        provider_pdf.file_path,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=provider_pdf.filename
    )


@pdfs_bp.route('/pdfs/<int:pdf_id>/info', methods=['GET'])
def get_pdf_info(pdf_id):
    """Get PDF info without downloading"""
    provider_pdf = ProviderPDF.query.get_or_404(pdf_id)
    return jsonify(provider_pdf.to_dict())


# ============ UPDATE PDF ============

@pdfs_bp.route('/pdfs/<int:pdf_id>', methods=['PUT'])
def update_pdf(pdf_id):
    """Update PDF metadata (filename, canvas dimensions)"""
    provider_pdf = ProviderPDF.query.get_or_404(pdf_id)
    
    data = request.get_json()
    
    if 'filename' in data:
        provider_pdf.filename = data['filename']
    if 'canvasWidth' in data:
        provider_pdf.canvas_width = data['canvasWidth']
    if 'canvasHeight' in data:
        provider_pdf.canvas_height = data['canvasHeight']
    
    db.session.commit()
    
    return jsonify(provider_pdf.to_dict())


# ============ DELETE PDF (Soft Delete) ============

@pdfs_bp.route('/pdfs/<int:pdf_id>', methods=['DELETE'])
def delete_pdf(pdf_id):
    """Soft delete a PDF (sets is_active=False)"""
    provider_pdf = ProviderPDF.query.get_or_404(pdf_id)
    
    # Soft delete
    provider_pdf.is_active = False
    db.session.commit()
    
    return jsonify({'message': 'PDF deleted', 'pdfId': pdf_id})


@pdfs_bp.route('/pdfs/<int:pdf_id>/hard-delete', methods=['DELETE'])
def hard_delete_pdf(pdf_id):
    """Permanently delete a PDF and its file"""
    provider_pdf = ProviderPDF.query.get_or_404(pdf_id)
    
    # Delete file from disk
    if os.path.exists(provider_pdf.file_path):
        os.remove(provider_pdf.file_path)
    
    # Delete database record (cascades to anchors)
    db.session.delete(provider_pdf)
    db.session.commit()
    
    return jsonify({'message': 'PDF permanently deleted', 'pdfId': pdf_id})


# ============ GET PDF PAGE AS IMAGE ============

@pdfs_bp.route('/pdfs/<int:pdf_id>/page/<int:page_num>', methods=['GET'])
def get_pdf_page(pdf_id, page_num):
    """Get specific page as image (for preview)"""
    provider_pdf = ProviderPDF.query.get_or_404(pdf_id)
    
    if not os.path.exists(provider_pdf.file_path):
        return jsonify({'error': 'PDF file not found on disk'}), 404
    
    try:
        with open(provider_pdf.file_path, 'rb') as f:
            pdf_bytes = f.read()
            image_bytes = render_page_as_image(pdf_bytes, page_num)
        
        return send_file(
            io.BytesIO(image_bytes),
            mimetype='image/png',
            as_attachment=False
        )
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


# ============ DUPLICATE CHECK ============

@pdfs_bp.route('/pdf/check-duplicate', methods=['POST'])
def check_pdf_duplicate():
    """Check if PDF already exists by content (without uploading)"""
    if 'pdf' not in request.files:
        return jsonify({'error': 'No PDF file provided'}), 400
    
    file = request.files['pdf']
    pdf_bytes = file.read()
    
    # Generate content hash
    content_hash = get_pdf_content_hash(pdf_bytes)
    
    # Check for existing PDF
    existing_pdf = ProviderPDF.find_by_hash(content_hash)
    
    if existing_pdf and existing_pdf.is_active:
        existing_provider = Provider.query.get(existing_pdf.provider_id)
        return jsonify({
            'isDuplicate': True,
            'existingPdfId': existing_pdf.id,
            'existingProviderId': str(existing_pdf.provider_id),
            'existingProviderName': existing_provider.name if existing_provider else None,
            'filename': existing_pdf.filename
        })
    
    return jsonify({
        'isDuplicate': False
    })


# ============ BACKWARD COMPATIBILITY ============
# These routes support the old single-PDF-per-provider pattern

@pdfs_bp.route('/providers/<int:provider_id>/pdf', methods=['POST'])
def upload_pdf_legacy(provider_id):
    """Legacy: Upload PDF (redirects to new multi-PDF endpoint)"""
    return upload_pdf(provider_id)


@pdfs_bp.route('/providers/<int:provider_id>/pdf', methods=['GET'])
def get_pdf_legacy(provider_id):
    """Legacy: Get first active PDF for provider"""
    provider = Provider.query.get_or_404(provider_id)
    
    # Get first active PDF
    provider_pdf = ProviderPDF.query.filter_by(
        provider_id=provider_id,
        is_active=True
    ).first()
    
    if not provider_pdf:
        return jsonify({'error': 'No PDF found for this provider'}), 404
    
    if not os.path.exists(provider_pdf.file_path):
        return jsonify({'error': 'PDF file not found on disk'}), 404
    
    return send_file(
        provider_pdf.file_path,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=provider_pdf.filename
    )


@pdfs_bp.route('/providers/<int:provider_id>/pdf/info', methods=['GET'])
def get_pdf_info_legacy(provider_id):
    """Legacy: Get info of first active PDF for provider"""
    provider_pdf = ProviderPDF.query.filter_by(
        provider_id=provider_id,
        is_active=True
    ).first()
    
    if not provider_pdf:
        return jsonify({'error': 'No PDF found for this provider'}), 404
    
    return jsonify(provider_pdf.to_dict())
