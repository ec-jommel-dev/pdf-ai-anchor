"""
Auto-Fill Route - Process PDF with anchor settings
Supports both direct anchor input and PDF-based anchor lookup
"""
from flask import Blueprint, request, send_file, jsonify
from services.pdf_service import place_anchors_on_pdf
from models import ProviderPDF
import io
import json

autofill_bp = Blueprint('autofill', __name__)


@autofill_bp.route('/autofill', methods=['POST'])
def autofill():
    """
    Process PDF with anchor settings and return filled PDF.
    
    Expects:
        - pdf: PDF file (multipart/form-data)
        - anchors: JSON string of anchor settings
        - canvasWidth: Canvas width when anchors were placed (optional)
        - canvasHeight: Canvas height when anchors were placed (optional)
        - preview: "true" for red text (preview), "false" for white text (final output)
    
    Returns:
        - Filled PDF as download
    """
    # Validate PDF file
    if 'pdf' not in request.files:
        return jsonify({'error': 'No PDF file provided'}), 400
    
    pdf_file = request.files['pdf']
    
    if pdf_file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Get anchors from form data
    anchors_json = request.form.get('anchors')
    if not anchors_json:
        return jsonify({'error': 'No anchor settings provided'}), 400
    
    try:
        anchors = json.loads(anchors_json)
    except json.JSONDecodeError:
        return jsonify({'error': 'Invalid anchor settings JSON'}), 400
    
    if not anchors or len(anchors) == 0:
        return jsonify({'error': 'At least one anchor is required'}), 400
    
    # Get canvas dimensions
    canvas_width = int(request.form.get('canvasWidth', 1224))
    canvas_height = int(request.form.get('canvasHeight', 1584))
    
    # Get preview mode (default: False = white text for clean output)
    preview_param = request.form.get('preview', 'false').lower()
    is_preview = preview_param == 'true'
    
    # Read PDF bytes
    pdf_bytes = pdf_file.read()
    
    try:
        # Process PDF with anchors
        # preview=True: Red text (for verification)
        # preview=False: White text (for clean final output)
        result_pdf = place_anchors_on_pdf(
            pdf_bytes,
            anchors,
            canvas_width,
            canvas_height,
            preview=is_preview
        )
        
        # Set filename based on mode
        filename = 'preview_contract.pdf' if is_preview else 'filled_contract.pdf'
        
        # Return filled PDF
        return send_file(
            io.BytesIO(result_pdf),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
    
    except Exception as e:
        return jsonify({'error': f'Failed to process PDF: {str(e)}'}), 500


@autofill_bp.route('/autofill/pdf/<int:pdf_id>', methods=['POST'])
def autofill_with_pdf_anchors(pdf_id):
    """
    Process uploaded PDF using anchors from a specific saved PDF.
    
    Expects:
        - pdf: PDF file to process (multipart/form-data)
        - preview: "true" for red text, "false" for white text
    
    Uses:
        - Anchors from the specified PDF ID
        - Canvas dimensions from the specified PDF
    
    Returns:
        - Filled PDF as download
    """
    # Get the saved PDF with its anchors
    saved_pdf = ProviderPDF.query.get_or_404(pdf_id)
    
    if not saved_pdf.anchors or len(saved_pdf.anchors) == 0:
        return jsonify({'error': 'No anchor settings found for this PDF'}), 400
    
    # Validate uploaded PDF file
    if 'pdf' not in request.files:
        return jsonify({'error': 'No PDF file provided'}), 400
    
    pdf_file = request.files['pdf']
    
    if pdf_file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Get preview mode
    preview_param = request.form.get('preview', 'false').lower()
    is_preview = preview_param == 'true'
    
    # Read PDF bytes
    pdf_bytes = pdf_file.read()
    
    # Get anchors from the saved PDF
    anchors = [a.to_dict() for a in saved_pdf.anchors]
    
    # Use canvas dimensions from saved PDF
    canvas_width = saved_pdf.canvas_width or 1224
    canvas_height = saved_pdf.canvas_height or 1584
    
    try:
        result_pdf = place_anchors_on_pdf(
            pdf_bytes,
            anchors,
            canvas_width,
            canvas_height,
            preview=is_preview
        )
        
        filename = 'preview_contract.pdf' if is_preview else 'filled_contract.pdf'
        
        return send_file(
            io.BytesIO(result_pdf),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
    
    except Exception as e:
        return jsonify({'error': f'Failed to process PDF: {str(e)}'}), 500
