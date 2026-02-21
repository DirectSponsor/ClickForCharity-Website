#!/usr/bin/env python3
"""
Privacy-First Web Analytics - Daily JSON Generator
Parses Apache/Nginx logs and generates JSON stats for each day
Output: report-YYYY-MM-DD.json in data directory for dashboard consumption
"""

import re
import json
import hashlib
from datetime import datetime, timedelta
from collections import Counter, defaultdict
from pathlib import Path
import argparse

class DailyAnalyzer:
    def __init__(self, data_dir='./data/analytics'):
        self.apache_pattern = re.compile(
            r'(?P<ip>\S+) \S+ \S+ \[(?P<timestamp>[^\]]+)\] '
            r'"(?P<method>\S+) (?P<path>\S+) (?P<protocol>\S+)" '
            r'(?P<status>\d+) (?P<size>\S+) "(?P<referrer>[^"]*)" "(?P<user_agent>[^"]*)"'
        )
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.entries = []
        
    def parse_log_file(self, filepath):
        """Parse log file into entries"""
        print("Parsing {}...".format(filepath))
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                for line in f:
                    entry = self.parse_line(line)
                    if entry:
                        self.entries.append(entry)
        except Exception as e:
            print("Error reading {}: {}".format(filepath, e))
            return False
        print("Parsed {} entries".format(len(self.entries)))
        return True
    
    def parse_line(self, line):
        """Parse a single log line"""
        match = self.apache_pattern.match(line)
        if not match:
            return None
        
        data = match.groupdict()
        
        # Skip non-GET/HEAD requests
        if data['method'] not in ['GET', 'HEAD']:
            return None
        
        # Skip error responses
        status = int(data['status'])
        if status >= 400:
            return None
        
        # Skip API endpoints and analytics data files
        if data['path'].startswith('/api/') or data['path'].startswith('/data/analytics/'):
            return None

        # Skip static assets (only count actual page views)
        path = data['path'].lower()
        static_extensions = ('.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot')
        if path.endswith(static_extensions):
            return None
        
        try:
            timestamp = datetime.strptime(data['timestamp'], '%d/%b/%Y:%H:%M:%S %z')
        except:
            try:
                timestamp = datetime.strptime(data['timestamp'].split()[0], '%d/%b/%Y:%H:%M:%S')
            except:
                return None
        
        # Strip query string from path
        clean_path = data['path'].split('?')[0]

        return {
            'ip': data['ip'],
            'timestamp': timestamp,
            'date': timestamp.date(),
            'path': clean_path,
            'status': status,
            'size': 0 if data['size'] == '-' else int(data['size']),
            'referrer': None if data['referrer'] == '-' else data['referrer'],
            'user_agent': data['user_agent']
        }
    
    def detect_browser(self, user_agent):
        """Detect browser from user agent"""
        if not user_agent or user_agent == '-':
            return 'Unknown'
        
        ua = user_agent
        browsers = {
            'Chrome': r'Chrome/[\d.]+',
            'Safari': r'Safari/[\d.]+(?!.*Chrome)',
            'Firefox': r'Firefox/[\d.]+',
            'Edge': r'Edg/[\d.]+',
            'Opera': r'OPR/[\d.]+',
            'Mobile Safari': r'Mobile.*Safari/[\d.]+(?!.*Chrome)',
        }
        
        for browser, pattern in browsers.items():
            if re.search(pattern, ua):
                return browser
        
        return 'Other'
    
    def is_bot(self, user_agent):
        """Check if user agent is a bot"""
        bot_patterns = [
            'bot', 'crawl', 'spider', 'slurp', 'baidu',
            'yandex', 'duckduck', 'ia_archiver', 'facebookexternalhit',
            'semrush', 'ahrefsbot', 'mj12bot', 'dotbot', 'petalbot'
        ]
        ua_lower = user_agent.lower()
        return any(pattern in ua_lower for pattern in bot_patterns)
    
    def clean_referrer(self, referrer):
        """Extract domain from referrer URL"""
        # Empty referrer header (no value)
        if not referrer or referrer == '-':
            return 'Direct (typed/bookmark)'
        
        # Empty string after dash (shouldn't happen, but catch it)
        if referrer.strip() == '':
            return 'Direct (typed/bookmark)'
        
        try:
            # First, check if it's an internal link (same domain)
            if 'clickforcharity.net' in referrer.lower():
                # Extract the path if available
                path_match = re.search(r'https?://[^/]+(/[^\s]*)', referrer)
                if path_match:
                    path = path_match.group(1)
                    if path == '/' or path == '':
                        return 'Internal (from homepage)'
                    else:
                        # Truncate long paths for readability
                        if len(path) > 40:
                            path = path[:37] + '...'
                        return 'Internal (from {})'.format(path)
                else:
                    return 'Internal (within site)'
            
            # External domain
            match = re.search(r'https?://([^/]+)', referrer)
            if match:
                domain = match.group(1)
                if domain.startswith('www.'):
                    domain = domain[4:]
                return domain
        except:
            pass
        
        # Couldn't extract domain from referrer header
        # (header present but malformed, or privacy-stripped)
        return 'Referrer (stripped/unknown)'
    
    def analyze_by_date(self):
        """Generate stats grouped by date"""
        daily_stats = defaultdict(lambda: {
            'visitors': set(),
            'pageviews': 0,
            'pages': Counter(),
            'referrers': Counter(),
            'browsers': Counter(),
            'bandwidth': 0
        })
        
        for entry in self.entries:
            if self.is_bot(entry['user_agent']):
                continue
            
            date_str = entry['date'].isoformat()
            stats = daily_stats[date_str]
            
            visitor_token = hashlib.sha256(
                (entry['ip'] + entry['user_agent'] + date_str).encode()
            ).hexdigest()
            stats['visitors'].add(visitor_token)
            stats['pageviews'] += 1
            stats['pages'][entry['path']] += 1
            stats['referrers'][self.clean_referrer(entry['referrer'])] += 1
            stats['browsers'][self.detect_browser(entry['user_agent'])] += 1
            stats['bandwidth'] += entry['size']
        
        return daily_stats
    
    def generate_daily_reports(self):
        """Generate and save JSON report for each day"""
        daily_stats = self.analyze_by_date()
        
        if not daily_stats:
            print("No data to analyze!")
            return False
        
        for date_str in sorted(daily_stats.keys()):
            stats = daily_stats[date_str]
            
            # Generate report
            report = {
                'date': date_str,
                'summary': {
                    'visitors': len(stats['visitors']),
                    'pageviews': stats['pageviews'],
                    'bandwidth_mb': round(stats['bandwidth'] / (1024 * 1024), 2)
                },
                'pages': [
                    {'path': path, 'views': count}
                    for path, count in stats['pages'].most_common(20)
                ],
                'referrers': [
                    {'source': ref, 'visits': count}
                    for ref, count in stats['referrers'].most_common(10)
                ],
                'browsers': [
                    {'name': browser, 'visits': count}
                    for browser, count in stats['browsers'].most_common(10)
                ]
            }
            
            # Save to JSON
            output_file = self.data_dir / 'report-{}.json'.format(date_str)
            try:
                with open(str(output_file), 'w') as f:
                    json.dump(report, f, indent=2)
                print("Generated: {}".format(output_file.name))
            except Exception as e:
                print("Error saving {}: {}".format(output_file, e))
                return False
        
        return True

def main():
    parser = argparse.ArgumentParser(description='Generate daily analytics JSON reports')
    parser.add_argument('logfile', help='Path to Apache/Nginx log file')
    parser.add_argument('-d', '--data-dir', default='./data/analytics', 
                        help='Directory to store JSON reports (default: ./data/analytics)')
    args = parser.parse_args()
    
    analyzer = DailyAnalyzer(args.data_dir)
    if not analyzer.parse_log_file(args.logfile):
        return 1
    
    if not analyzer.generate_daily_reports():
        return 1
    
    print("\nAll reports generated successfully!")
    return 0

if __name__ == '__main__':
    exit(main())
