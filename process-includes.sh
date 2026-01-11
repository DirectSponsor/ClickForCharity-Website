#!/bin/bash

# Process HTML includes for ClickForCharity
# This script processes <!-- include start/end --> markers and #VARIABLE# replacements

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Process a single HTML file
process_file() {
    local file="$1"
    local temp_file="${file}.tmp"
    
    log "Processing $file..."
    
    # Read the file line by line
    local in_include=0
    local include_file=""
    local output=""
    
    while IFS= read -r line; do
        # Check for include start marker
        if [[ "$line" =~ \<!--\ include\ start\ (.+)\ --\> ]]; then
            include_file="${BASH_REMATCH[1]}"
            in_include=1
            output+="$line"$'\n'
            
            # Read and insert the include file content
            if [[ -f "includes/$include_file" ]]; then
                output+="$(cat "includes/$include_file")"$'\n'
            else
                echo "Warning: Include file 'includes/$include_file' not found"
            fi
            continue
        fi
        
        # Check for include end marker
        if [[ "$line" =~ \<!--\ include\ end\ (.+)\ --\> ]]; then
            in_include=0
            output+="$line"$'\n'
            continue
        fi
        
        # Skip lines between include markers (they'll be replaced by include content)
        if [[ $in_include -eq 1 ]]; then
            continue
        fi
        
        # Keep all other lines
        output+="$line"$'\n'
    done < "$file"
    
    # Now process variables based on filename
    local basename=$(basename "$file" .html)
    
    # Replace all #ACTIVE_*# markers with empty string first
    output="${output//#ACTIVE_HOME#/}"
    output="${output//#ACTIVE_PTC#/}"
    output="${output//#ACTIVE_SIMPLE_TASKS#/}"
    output="${output//#ACTIVE_SKIPPED_TASKS#/}"
    output="${output//#ACTIVE_SURVEYS#/}"
    output="${output//#ACTIVE_OFFERS#/}"
    output="${output//#ACTIVE_PROFILE#/}"
    output="${output//#ACTIVE_BALANCE_SYNC_HELP#/}"
    
    # Set the appropriate active class based on filename
    case "$basename" in
        "index")
            output="${output//\<li \><a href=\"index.html\">/<li class=\"active\"><a href=\"index.html\">}"
            ;;
        "ptc")
            output="${output//\<li \><a href=\"ptc.html\">/<li class=\"active\"><a href=\"ptc.html\">}"
            ;;
        "simple-tasks")
            output="${output//\<li \><a href=\"simple-tasks.html\">/<li class=\"active\"><a href=\"simple-tasks.html\">}"
            ;;
        "skipped-tasks")
            output="${output//\<li \><a href=\"skipped-tasks.html\">/<li class=\"active\"><a href=\"skipped-tasks.html\">}"
            ;;
        "surveys")
            output="${output//\<li \><a href=\"surveys.html\">/<li class=\"active\"><a href=\"surveys.html\">}"
            ;;
        "offers")
            output="${output//\<li \><a href=\"offers.html\">/<li class=\"active\"><a href=\"offers.html\">}"
            ;;
        "profile")
            output="${output//\<li \><a href=\"profile.html\">/<li class=\"active\"><a href=\"profile.html\">}"
            ;;
        "balance-sync-help")
            # No active nav item for help page
            ;;
    esac
    
    # Write output to file
    echo -n "$output" > "$temp_file"
    mv "$temp_file" "$file"
    
    success "Processed $file"
}

# Main execution
main() {
    log "Starting include processing..."
    
    # Process all HTML files in root directory
    for file in *.html; do
        # Skip admin pages and sitemap
        if [[ "$file" == admin*.html ]] || [[ "$file" == "sitemap.html" ]]; then
            continue
        fi
        
        # Only process files that have include markers
        if grep -q "<!-- include start" "$file"; then
            process_file "$file"
        fi
    done
    
    success "All files processed!"
}

main "$@"
