"""
Anchor Routes - CRUD operations for anchor settings
"""
from flask import Blueprint, request, jsonify
from database import db
from models import Provider, Anchor

anchors_bp = Blueprint('anchors', __name__)


@anchors_bp.route('/providers/<int:provider_id>/anchors', methods=['GET'])
def get_anchors(provider_id):
    """Get all anchors for a provider"""
    provider = Provider.query.get_or_404(provider_id)
    return jsonify([a.to_dict() for a in provider.anchors])


@anchors_bp.route('/anchors/<int:anchor_id>', methods=['GET'])
def get_anchor(anchor_id):
    """Get single anchor by ID"""
    anchor = Anchor.query.get_or_404(anchor_id)
    return jsonify(anchor.to_dict())


@anchors_bp.route('/providers/<int:provider_id>/anchors', methods=['POST'])
def create_anchor(provider_id):
    """Create new anchor for provider"""
    provider = Provider.query.get_or_404(provider_id)
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    # Validate required fields
    if not data.get('text'):
        return jsonify({'error': 'Anchor text is required'}), 400
    
    anchor = Anchor(
        provider_id=provider.id,
        text=data['text'],
        x=data.get('x', 0),
        y=data.get('y', 0),
        page=data.get('page', '1'),
        canvas_width=data.get('canvasWidth'),
        canvas_height=data.get('canvasHeight')
    )
    
    db.session.add(anchor)
    db.session.commit()
    
    return jsonify(anchor.to_dict()), 201


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
