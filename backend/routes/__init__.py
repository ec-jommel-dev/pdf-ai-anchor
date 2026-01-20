"""
Routes package - exports all API blueprints
"""
from .providers import providers_bp
from .anchors import anchors_bp
from .pdfs import pdfs_bp
from .autofill import autofill_bp

__all__ = ['providers_bp', 'anchors_bp', 'pdfs_bp', 'autofill_bp']
