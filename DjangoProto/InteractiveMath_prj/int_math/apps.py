#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Module Name: apps.py
Description: The website code is generic, a config file is needed to point to proprietery SVG, MP3 etc.  There is
            a test config file with generic files (tiny) or the proprietary one created by user with artistic content. 
            Load all this up once since it is not anticipated to change often
Author: C De Meyer (and Gemini AI)
Date: 5/4/2026
Version: 1.0.0
"""
import json
import logging
from pathlib import Path
from django.apps import AppConfig
from django.conf import settings

logger = logging.getLogger(__name__)

class IntMathConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'int_math'
    
    # This will hold your mapping in memory for the life of the server
    config_map = {}

    def ready(self):
        # Determine path (Using Pathlib for Django 5.2 style)
        use_deploy = getattr(settings, 'USE_CLOUD_BUCKET', 'False').lower() == 'true'
        config_subpath = 'DeployConfig' if (use_deploy or settings.DEBUG) else 'TestConfig'
        
        file_path = settings.BASE_DIR / 'ConfigFiles' / config_subpath / 'binaryfilenamesforsite-portion1-rev-a.json'
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                # Store it directly on the class
                IntMathConfig.config_map = json.load(f)
            logger.info("Configuration Mapping loaded successfully.")
        except Exception:
            logger.exception(f"CRITICAL: Could not load config file at {file_path}")
