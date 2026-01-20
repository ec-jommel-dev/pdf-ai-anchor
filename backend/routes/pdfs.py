"""
PDF Routes - Upload, download, and preview PDFs
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


@pdfs_bp.route('/providers/<int:provider_id>/pdf', methods=['POST'])
def upload_pdf(provider_id):
    """Upload PDF for provider with duplicate detection"""
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
    
    # Check for duplicate PDF (same content already uploaded)
    existing_pdf = ProviderPDF.find_by_hash(content_hash)
    if existing_pdf and existing_pdf.provider_id != provider_id:
        # PDF exists for ANOTHER provider
        existing_provider = Provider.query.get(existing_pdf.provider_id)
        return jsonify({
            'warning': 'duplicate_found',
            'message': f'This PDF is already uploaded for provider: {existing_provider.name if existing_provider else "Unknown"}',
            'existingProviderId': str(existing_pdf.provider_id),
            'existingProviderName': existing_provider.name if existing_provider else None
        }), 409  # Conflict
    
    # Secure the filename
    filename = secure_filename(file.filename)
    
    # Create uploads directory if it doesn't exist
    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    
    # Create unique filename with provider ID
    unique_filename = f"provider_{provider_id}_{filename}"
    file_path = os.path.join(upload_folder, unique_filename)
    
    # Delete existing PDF if any (replacing with new one)
    if provider.pdf:
        old_path = provider.pdf.file_path
        if os.path.exists(old_path):
            os.remove(old_path)
        db.session.delete(provider.pdf)
    
    # Save file
    file.save(file_path)
    
    # Get file info
    file_size = os.path.getsize(file_path)
    total_pages = get_pdf_page_count(pdf_bytes)
    
    # Create database record with hash
    provider_pdf = ProviderPDF(
        provider_id=provider.id,
        filename=filename,
        file_path=file_path,
        file_size=file_size,
        total_pages=total_pages,
        content_hash=content_hash
    )
    
    db.session.add(provider_pdf)
    db.session.commit()
    
    return jsonify(provider_pdf.to_dict()), 201


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
    
    if existing_pdf:
        existing_provider = Provider.query.get(existing_pdf.provider_id)
        return jsonify({
            'isDuplicate': True,
            'existingProviderId': str(existing_pdf.provider_id),
            'existingProviderName': existing_provider.name if existing_provider else None,
            'filename': existing_pdf.filename
        })
    
    return jsonify({
        'isDuplicate': False
    })


@pdfs_bp.route('/providers/<int:provider_id>/pdf', methods=['GET'])
def get_pdf(provider_id):
    """Download provider's PDF"""
    provider = Provider.query.get_or_404(provider_id)
    
    if not provider.pdf:
        return jsonify({'error': 'No PDF found for this provider'}), 404
    
    if not os.path.exists(provider.pdf.file_path):
        return jsonify({'error': 'PDF file not found on disk'}), 404
    
    return send_file(
        provider.pdf.file_path,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=provider.pdf.filename
    )


@pdfs_bp.route('/providers/<int:provider_id>/pdf', methods=['DELETE'])
def delete_pdf(provider_id):
    """Delete provider's PDF"""
    provider = Provider.query.get_or_404(provider_id)
    
    if not provider.pdf:
        return jsonify({'error': 'No PDF found for this provider'}), 404
    
    # Delete file from disk
    if os.path.exists(provider.pdf.file_path):
        os.remove(provider.pdf.file_path)
    
    # Delete database record
    db.session.delete(provider.pdf)
    db.session.commit()
    
    return jsonify({'message': 'PDF deleted', 'provider_id': provider_id})


@pdfs_bp.route('/providers/<int:provider_id>/pdf/page/<int:page_num>', methods=['GET'])
def get_pdf_page(provider_id, page_num):
    """Get specific page as image (for preview)"""
    provider = Provider.query.get_or_404(provider_id)
    
    if not provider.pdf:
        return jsonify({'error': 'No PDF found for this provider'}), 404
    
    if not os.path.exists(provider.pdf.file_path):
        return jsonify({'error': 'PDF file not found on disk'}), 404
    
    try:
        with open(provider.pdf.file_path, 'rb') as f:
            pdf_bytes = f.read()
            image_bytes = render_page_as_image(pdf_bytes, page_num)
        
        return send_file(
            io.BytesIO(image_bytes),
            mimetype='image/png',
            as_attachment=False
        )
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@pdfs_bp.route('/providers/<int:provider_id>/pdf/info', methods=['GET'])
def get_pdf_info(provider_id):
    """Get PDF info without downloading"""
    provider = Provider.query.get_or_404(provider_id)
    
    if not provider.pdf:
        return jsonify({'error': 'No PDF found for this provider'}), 404
    
    return jsonify(provider.pdf.to_dict())
