#!/usr/bin/env python3
"""
Compact CATHEDRAL by removing redundant duplicate files and consolidating similar content.
"""
import os
import hashlib
from pathlib import Path
from collections import defaultdict

def get_file_hash(filepath):
    """Get SHA256 hash of file content."""
    try:
        with open(filepath, 'rb') as f:
            return hashlib.sha256(f.read()).hexdigest()
    except:
        return None

def find_duplicates(root_dir):
    """Find duplicate files by content hash."""
    hash_map = defaultdict(list)
    
    # Skip .git directory
    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d != '.git']
        
        for file in files:
            if file.endswith('.md'):
                filepath = os.path.join(root, file)
                file_hash = get_file_hash(filepath)
                if file_hash:
                    hash_map[file_hash].append(filepath)
    
    return {h: paths for h, paths in hash_map.items() if len(paths) > 1}

def remove_duplicates(duplicates, root_dir):
    """Remove duplicate files, keeping one copy in each major directory."""
    kept_files = []
    removed_files = []
    
    for file_hash, paths in duplicates.items():
        # Sort paths by depth and keep shortest path
        paths.sort(key=lambda p: (p.count(os.sep), len(p)))
        
        # Keep first one, remove rest
        kept = paths[0]
        kept_files.append(kept)
        
        for dup in paths[1:]:
            try:
                os.remove(dup)
                removed_files.append(dup)
                print(f"Removed duplicate: {dup}")
            except Exception as e:
                print(f"Error removing {dup}: {e}")
    
    return kept_files, removed_files

def main():
    root_dir = '/mnt/f/CATHEDRAL'
    
    print("Finding duplicate files...")
    duplicates = find_duplicates(root_dir)
    
    total_duplicates = sum(len(paths) - 1 for paths in duplicates.values())
    print(f"Found {len(duplicates)} unique files with {total_duplicates} duplicates")
    
    if total_duplicates > 0:
        print("\nRemoving duplicates...")
        kept, removed = remove_duplicates(duplicates, root_dir)
        print(f"\nKept {len(kept)} files, removed {len(removed)} duplicates")
        
        # Save summary
        with open('/mnt/f/CATHEDRAL/COMPACTION_SUMMARY.md', 'w') as f:
            f.write("# CATHEDRAL Compaction Summary\n\n")
            f.write(f"- Total unique files: {len(duplicates)}\n")
            f.write(f"- Duplicates removed: {len(removed)}\n")
            f.write(f"- Space optimization: {len(removed)} redundant files eliminated\n\n")
            f.write("## Files Removed\n\n")
            for r in removed[:100]:  # Limit to first 100
                f.write(f"- {r}\n")
            if len(removed) > 100:
                f.write(f"\n...and {len(removed) - 100} more files\n")
    
    print("\nCompaction complete!")

if __name__ == '__main__':
    main()
