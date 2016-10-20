(function() {
    
    var width = 540;
    var height = 0;
    
    var webcam = null;
    var picture = null;
    var caption = null;
    
    function startWebcam() {
        webcam = document.getElementById('webcam');
        picture = document.getElementById('picture');
        caption = document.getElementById('caption');
        
        webcam.setAttribute('width', width);
        picture.setAttribute('width', width);
        
        navigator.getUserMedia(
            {
                video: true,
                audio: false
            },
            function(stream) {
                webcam.src = window.URL.createObjectURL(stream);
                webcam.play();
            },
            function(error) {
                console.error(error);
            }
        );
        
        webcam.addEventListener(
            'canplay',
            function(event) {
                if (height == 0) {
                    height = webcam.videoHeight / (webcam.videoWidth / width);
                    webcam.setAttribute('height', height);
                    picture.setAttribute('height', height);
                }
            },
            false
        );
        
        webcam.addEventListener(
            'click',
            function(event) {
                takePicture();
                event.preventDefault();
            },
            false
        );
    }
    
    function makeBlob(dataURL) {
        var parts = dataURL.split(';base64,');
        var contentType = parts[0].split(':')[1];
        var raw = window.atob(parts[1]);
        var rawLength = raw.length;
        
        var uInt8Array = new Uint8Array(rawLength);
        for (var i = 0; i < rawLength; i++) {
            uInt8Array[i] = raw.charCodeAt(i);
        }
        
        return new Blob([uInt8Array], { type: contentType });
    }
    
    function takePicture() {
        var canvas = picture.getContext('2d');
        canvas.drawImage(webcam, 0, 0, width, height);
        
        $.ajax({
            type: "POST",
            url : "https://api.projectoxford.ai/vision/v1.0/analyze?visualFeatures=Description,Faces,Color",
            headers: {
                "Content-Type": "application/octet-stream",
                "Ocp-Apim-Subscription-Key": "YourSubscriptionKey"
            },
            data : makeBlob(picture.toDataURL('image/jpeg')),
            processData: false
        }).done(function(data) {
            console.info(JSON.stringify(data));
            
            caption.innerHTML = data.description.captions[0].text;
            
            canvas.strokeStyle = "red";
            canvas.fillStyle = "red";
            canvas.lineWidth = 4;
            canvas.textAlign = "center";
            canvas.font = "24px Arial";
            
            for (var i = 0; i < data.faces.length; i++) {
                var face = data.faces[i];
                var rect = face.faceRectangle;
                
                canvas.strokeRect(rect.left, rect.top, rect.width, rect.height);
                canvas.fillText(face.gender + " " + face.age, rect.left + (rect.width / 2), rect.top - 12);
            }
            
            document.body.style.backgroundColor = "#" + data.color.accentColor;
        }).fail(function(data) {
            console.error(JSON.stringify(data));
        });
    }
    
    window.addEventListener('load', startWebcam, false);
    
})();
