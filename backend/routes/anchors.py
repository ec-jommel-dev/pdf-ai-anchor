"""
Anchor Routes - CRUD operations for anchor settings
Anchors now belong to PDFs (not directly to providers)
"""
from flask import Blueprint, request, jsonify
from database import db
from models import Provider, Anchor, ProviderPDF

anchors_bp = Blueprint('anchors', __name__)


# ============ ANCHORS BY PDF ============

@anchors_bp.route('/pdfs/<int:pdf_id>/anchors', methods=['GET'])
def get_pdf_anchors(pdf_id):
    """Get all anchors for a specific PDF"""
    provider_pdf = ProviderPDF.query.get_or_404(pdf_id)
    return jsonify([a.to_dict() for a in provider_pdf.anchors])


@anchors_bp.route('/pdfs/<int:pdf_id>/anchors', methods=['POST'])
def create_anchor_for_pdf(pdf_id):
    """Create new anchor for a specific PDF"""
    provider_pdf = ProviderPDF.query.get_or_404(pdf_id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    # Validate required fields
    if not data.get('text'):
        return jsonify({'error': 'Anchor text is required'}), 400
    
    anchor = Anchor(
        pdf_id=provider_pdf.id,
        text=data['text'],
        x=data.get('x', 0),
        y=data.get('y', 0),
        page=data.get('page', '1'),
        canvas_width=data.get('canvasWidth') or provider_pdf.canvas_width,
        canvas_height=data.get('canvasHeight') or provider_pdf.canvas_height
    )
    
    db.session.add(anchor)
    db.session.commit()
    
    return jsonify(anchor.to_dict()), 201


# ============ SINGLE ANCHOR OPERATIONS ============

@anchors_bp.route('/anchors/<int:anchor_id>', methods=['GET'])
def get_anchor(anchor_id):
    """Get single anchor by ID"""
    anchor = Anchor.query.get_or_404(anchor_id)
    return jsonify(anchor.to_dict())


@anchors_bp.route('/anchors/<int:anchor_id>', methods=['PUT'])
def update_anchor(anchor_id):
    """Update anchor"""
    anchor = Anchor.query.get_or_404(anchor_id)
    data = request.get_json()
    
    if data.get('text'):
        anchor.text = data['text']
    if 'x' in data:
        anchor.x = data['x']
    if 'y' in data:
        anchor.y = data['y']
    if 'page' in data:
        anchor.page = data['page']
    if 'canvasWidth' in data:
        anchor.canvas_width = data['canvasWidth']
    if 'canvasHeight' in data:
        anchor.canvas_height = data['canvasHeight']
    
    db.session.commit()
    
    return jsonify(anchor.to_dict())


@anchors_bp.route('/anchors/<int:anchor_id>', methods=['DELETE'])
def delete_anchor(anchor_id):
    """Delete anchor (hard delete)"""
    anchor = Anchor.query.get_or_404(anchor_id)
    
    db.session.delete(anchor)
    db.session.commit()
    
    return jsonify({'message': 'Anchor deleted', 'id': anchor_id})


# ============ BACKWARD COMPATIBILITY (Provider-based) ============
# These routes aggregate all anchors across all PDFs for a provider

@anchors_bp.route('/providers/<int:provider_id>/anchors', methods=['GET'])
def get_provider_anchors(provider_id):
    """Get all anchors across all PDFs for a provider"""
    provider = Provider.query.get_or_404(provider_id)
    
    # Aggregate anchors from all active PDFs
    all_anchors = []
    for pdf in provider.pdfs:
        if pdf.is_active:
            for anchor in pdf.anchors:
                anchor_dict = anchor.to_dict()
                anchor_dict['pdfFilename'] = pdf.filename  # Add PDF context
                all_anchors.append(anchor_dict)
    
    return jsonify(all_anchors)


@anchors_bp.route('/providers/<int:provider_id>/anchors', methods=['POST'])
def create_anchor_legacy(provider_id):
    """Legacy: Create anchor for provider's first PDF"""
    provider = Provider.query.get_or_404(provider_id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    # Get pdf_id from request, or use first active PDF
    pdf_id = data.get('pdfId')
    
    if pdf_id:
        provider_pdf = ProviderPDF.query.get_or_404(pdf_id)
    else:
        # Use first active PDF for this provider
        provider_pdf = ProviderPDF.query.filter_by(
            provider_id=provider_id,
            is_active=True
        ).first()
        
        if not provider_pdf:
            return jsonify({'error': 'No PDF found for this provider. Please upload a PDF first.'}), 400
    
    # Validate required fields
    if not data.get('text'):
        return jsonify({'error': 'Anchor text is required'}), 400
    
    anchor = Anchor(
        pdf_id=provider_pdf.id,
        text=data['text'],
        x=data.get('x', 0),
        y=data.get('y', 0),
        page=data.get('page', '1'),
        canvas_width=data.get('canvasWidth') or provider_pdf.canvas_width,
        canvas_height=data.get('canvasHeight') or provider_pdf.canvas_height
    )
    
    db.session.add(anchor)
    db.session.commit()
    
    return jsonify(anchor.to_dict()), 201
