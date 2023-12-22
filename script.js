// Function to update the image preview
function updateImagePreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const imagePreview = document.getElementById('imagePreview');
        if (imagePreview) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
}

// Set up event listeners for the file input and drag-and-drop area
document.getElementById('imageInput').addEventListener('change', function() {
    if (this.files && this.files[0]) {
        updateImagePreview(this.files[0]);
    }
});

document.getElementById('drop-area').addEventListener('dragover', (event) => {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
});

document.getElementById('drop-area').addEventListener('drop', (event) => {
    event.stopPropagation();
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        document.getElementById('imageInput').files = files;
        updateImagePreview(files[0]);
    }
});

// Handle the generate button click
document.getElementById('generateButton').addEventListener('click', function() {
    const input = document.getElementById('imageInput');
    if (input.files && input.files[0]) {
        const formData = new FormData();
        formData.append('file', input.files[0]);

        // Display a loading message while processing the image
        const loadingMessage = document.getElementById('loadingMessage');
        loadingMessage.style.display = 'block';

        fetch('/process-image', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json(); // This will parse the JSON if the response is OK
        })
        .then(data => {
            loadingMessage.style.display = 'none'; // Hide loading message
            document.getElementById('textOutput').textContent = data.textOutput; // Update text output

            console.log(`/audio/${data.speechAudioFile}`); // output

            const speechAudioPlayer = document.getElementById('speechAudioPlayer');
            speechAudioPlayer.src = `/audio/${data.speechAudioFile}`;
            speechAudioPlayer.style.display = 'block';
        
            const downloadMusicLink = document.getElementById('downloadMusicLink');
            downloadMusicLink.href = `/audio/${data.speechAudioFile}`;
            downloadMusicLink.style.display = 'block';
            downloadMusicLink.textContent = 'Download Your BrandVision';
        })
        .catch(error => {
            loadingMessage.style.display = 'none'; // Hide loading message
            console.error('Error:', error);
            alert('There was a problem with your request: ' + error.message);
        });
    } else {
        alert('Please upload an image first.');
    }
});

// Optionally
document.getElementById('generateMusicButton').disabled = true;


function scrollToAnalysis() {
    // Check if the textOutput has content
    var textOutput = document.getElementById('textOutput');
    if (textOutput.textContent.trim() !== '') {
        // If content is not empty, scroll to the 'response-section'
        document.getElementById('response-section').scrollIntoView({ behavior: 'smooth' });
    } else {
        // If content is empty, wait and then try to scroll again
        setTimeout(scrollToAnalysis, 500);
    }
}
