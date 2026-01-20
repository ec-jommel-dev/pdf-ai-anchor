"""
Auto-Fill Route - Process PDF with anchor settings
"""
from flask import Blueprint, request, send_file, jsonify
from services.pdf_service import place_anchors_on_pdf
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
