const fileInput = document.getElementById('file-upload');
const previewArea = document.getElementById('preview-area');
const previewImage = document.getElementById('preview-image');
const fileName = document.getElementById('file-name');

fileInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            fileName.textContent = file.name;
            previewArea.style.display = 'block';
        }
        
        reader.readAsDataURL(file);
    }
});

// Allow drag and drop
const uploadArea = document.querySelector('.upload-area');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    uploadArea.style.backgroundColor = 'rgba(122, 179, 245, 0.1)';
}

function unhighlight() {
    uploadArea.style.backgroundColor = 'transparent';
}

uploadArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const file = dt.files[0];
    
    if (file && file.type.startsWith('image/')) {
        fileInput.files = dt.files;
        const reader = new FileReader();
        
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            fileName.textContent = file.name;
            previewArea.style.display = 'block';
        }
        
        reader.readAsDataURL(file);
    }
}

// Cancel button functionality
document.querySelector('.btn-cancel').addEventListener('click', function() {
    fileInput.value = '';
    previewArea.style.display = 'none';
    previewImage.src = '';
    fileName.textContent = '';
});
