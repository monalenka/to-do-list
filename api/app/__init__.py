from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_swagger_ui import get_swaggerui_blueprint

db = SQLAlchemy()

# Swagger configuration
SWAGGER_URL = '/api/docs'
API_URL = '/static/swagger.yaml'

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///todos.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    CORS(app)
    
    swaggerui_blueprint = get_swaggerui_blueprint(
        SWAGGER_URL,
        API_URL,
        config={
            'app_name': "Todo List API",
            'doc_expansion': 'none',
            'supportedSubmitMethods': ['get', 'post', 'put', 'delete', 'patch']
        }
    )
    app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)
    
    with app.app_context():
        from . import routes
        db.create_all()
        
    return app