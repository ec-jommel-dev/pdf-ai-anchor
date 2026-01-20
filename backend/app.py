"""
Main Flask Application
PDF Anchor - Energy Provider Contract Auto-Fill System
"""
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

from database import db
from config import config

def create_app(config_name='default'):
    """Application factory"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    
    # Enable CORS for frontend
    CORS(app, origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://127.0.0.1:3000"
    ])
    
    # Import and register blueprints
    from routes import providers_bp, anchors_bp, pdfs_bp, autofill_bp
    
    app.register_blueprint(providers_bp, url_prefix='/api')
    app.register_blueprint(anchors_bp, url_prefix='/api')
    app.register_blueprint(pdfs_bp, url_prefix='/api')
    app.register_blueprint(autofill_bp, url_prefix='/api')
    
    # Root endpoint - Simple status page
    @app.route('/', methods=['GET'])
    def index():
        return '''
        <!DOCTYPE html>
        <html>
        <head>
            <title>PDF Anchor API</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    color: #fff;
                }
                .container {
                    text-align: center;
                }
                .rocket {
                    font-size: 80px;
                    animation: bounce 2s infinite;
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                h1 {
                    font-size: 2.5rem;
                    margin: 20px 0 10px;
                    color: #4ade80;
                }
                p {
                    color: #94a3b8;
                    font-size: 1.1rem;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="rocket">🚀</div>
                <h1>Running...</h1>
                <p>PDF Anchor API v1.0.0</p>
            </div>
        </body>
        </html>
        '''
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {'status': 'healthy', 'message': 'PDF Anchor API is running'}
    
    # Create database tables
    with app.app_context():
        db.create_all()
        print("✅ Database tables created successfully!")
    
    return app


# Create app instance
app = create_app(os.getenv('FLASK_ENV', 'development'))


if __name__ == '__main__':
    print("🚀 Starting PDF Anchor Backend Server...")
    print(f"📍 Running on http://127.0.0.1:5001")
    print(f"📦 Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    app.run(debug=True, port=5001, host='0.0.0.0')
