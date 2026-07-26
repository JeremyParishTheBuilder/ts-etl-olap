import os
import sys

def generate_tree(start_dir, exclude_dirs=None):
    if exclude_dirs is None:
        exclude_dirs = {'node_modules', 'dist', 'build', '__pycache__', 'venv', '.venv'}
    
    tree = []
    start_dir = os.path.abspath(start_dir)
    
    if not os.path.exists(start_dir):
        return f"Error: The directory '{start_dir}' does not exist."

    for root, dirs, files in os.walk(start_dir):
        # 1. Filter out explicit exclusions and ANY folder starting with a dot in-place
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
        
        # 2. Calculate correct indentation depth relative to our start point
        relative_path = os.path.relpath(root, start_dir)
        if relative_path == '.':
            level = 0
            folder_name = os.path.basename(root)
        else:
            level = relative_path.count(os.sep) + 1
            folder_name = os.path.basename(root)
            
        indent = ' ' * 4 * level
        tree.append(f"{indent}{folder_name}/")
        
        # 3. Add every single file that doesn't start with a dot
        for f in files:
            if not f.startswith('.'):
                sub_indent = ' ' * 4 * (level + 1)
                tree.append(f"{sub_indent}{f}")
                
    return '\n'.join(tree)

if __name__ == "__main__":
    # Check if a target directory was passed as a command-line argument
    if len(sys.argv) > 1:
        target_path = sys.argv[1]
    else:
        target_path = "."
        
    print(f"Targeting: {os.path.abspath(target_path)}")
    print("-" * 40)
    
    output = generate_tree(target_path)
    print(output)