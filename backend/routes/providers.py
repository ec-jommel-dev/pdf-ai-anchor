"""
Provider Routes - CRUD operations for energy providers
"""
from flask import Blueprint, request, jsonify
from database import db
from models import Provider

providers_bp = Blueprint('providers', __name__)


@providers_bp.route('/providers', methods=['GET'])
def get_providers():
    """Get all providers (optionally include inactive)"""
    include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
    
    if include_inactive:
        providers = Provider.query.all()
    else:
        providers = Provider.query.filter_by(is_active=True).all()
    
    return jsonify([p.to_dict() for p in providers])


@providers_bp.route('/providers/<int:provider_id>', methods=['GET'])
def get_provider(provider_id):
    """Get single provider by ID"""
    provider = Provider.query.get_or_404(provider_id)
    return jsonify(provider.to_dict())


@providers_bp.route('/providers', methods=['POST'])
def create_provider():
    """Create new provider"""
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    
    provider = Provider(
        name=data['name'],
        is_active=data.get('active', True)
    )
    
    db.session.add(provider)
    db.session.commit()
    
    return jsonify(provider.to_dict()), 201


@providers_bp.route('/providers/<int:provider_id>', methods=['PUT'])
def update_provider(provider_id):
    """Update provider"""
    provider = Provider.query.get_or_404(provider_id)
    data = request.get_json()
    
    if data.get('name'):
        provider.name = data['name']
    
    if 'active' in data:
        provider.is_active = data['active']
    
    db.session.commit()
    
    return jsonify(provider.to_dict())


@providers_bp.route('/providers/<int:provider_id>', methods=['DELETE'])
def delete_provider(provider_id):
    """Soft delete provider (set is_active=False)"""
    provider = Provider.query.get_or_404(provider_id)
    provider.is_active = False
    db.session.commit()
    
    return jsonify({'message': 'Provider deactivated', 'id': provider_id})


@providers_bp.route('/providers/<int:provider_id>/restore', methods=['POST'])
def restore_provider(provider_id):
    """Restore soft-deleted provider"""
    provider = Provider.query.get_or_404(provider_id)
    provider.is_active = True
    db.session.commit()
    
    return jsonify(provider.to_dict())
