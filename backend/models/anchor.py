"""
Anchor Model - Anchor settings for PDF text placement
Now belongs to PDF (not directly to Provider)
"""
from database import db
from datetime import datetime

class Anchor(db.Model):
    __tablename__ = 'anchor_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    pdf_id = db.Column(db.Integer, db.ForeignKey('provider_pdfs.id'), nullable=False)  # Changed from provider_id
    text = db.Column(db.String(255), nullable=False)  # e.g., "{{signature}}"
    x = db.Column(db.Integer, nullable=False)  # X coordinate
    y = db.Column(db.Integer, nullable=False)  # Y coordinate
    page = db.Column(db.String(50), default='1')  # "1", "1,2,3", "last", "global"
    canvas_width = db.Column(db.Integer)  # Canvas width when anchor was placed
    canvas_height = db.Column(db.Integer)  # Canvas height when anchor was placed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert anchor to dictionary for JSON response"""
        return {
            'id': self.id,
            'pdfId': self.pdf_id,
            'text': self.text,
            'x': self.x,
            'y': self.y,
            'page': self.page,
            'canvasWidth': self.canvas_width,
            'canvasHeight': self.canvas_height
        }
    
    def __repr__(self):
        return f'<Anchor {self.text} at ({self.x}, {self.y})>'
