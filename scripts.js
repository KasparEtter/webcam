$(function() {
    // Binds the webcam stream to the video element and set the width and height accordingly.
    // Article: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Taking_still_photos
    // Code: https://github.com/mdn/samples-server/tree/master/s/webrtc-capturestill
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(function(stream) {
        const webcam = document.getElementById("webcam");
        webcam.srcObject = stream;
        webcam.play();
        const width = 540;
        $(".ratio").width(width);
        let height = webcam.videoHeight / (webcam.videoWidth / width);
        if (isNaN(height)) {
            height = width / 4 * 3;
        }
        $(".ratio").height(height);
    })
    .catch(function(error) {
        console.error(error);
    });

    // Converts a Base64-encoded picture to a binary blob.
    // Code: https://stackoverflow.com/questions/12168909/blob-from-dataurl
    function dataURLtoBlob(dataURL) {
        const parts = dataURL.split(";base64,");
        const contentType = parts[0].split(":")[1];
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; i++) {
            uInt8Array[i] = raw.charCodeAt(i);
        }
        return new Blob([uInt8Array], { type: contentType });
    }

    // Converts a number between 0 and 1 to a string with the percentage symbol.
    function numberToPercentageString(value) {
        return Math.round(value * 100) + "%"
    }

    // Code adapted from https://stackoverflow.com/a/41491220.
    function pickTextColorBasedOnBgColor(bgColor, lightColor, darkColor) {
        var color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
        var r = parseInt(color.substring(0, 2), 16);
        var g = parseInt(color.substring(2, 4), 16);
        var b = parseInt(color.substring(4, 6), 16);
        return (((r * 0.299) + (g * 0.587) + (b * 0.114)) > 186) ? darkColor : lightColor;
    }

    // Takes a picture from the website feed and sends it to a Microsoft API for analysis.
    // Service: https://azure.microsoft.com/en-us/services/cognitive-services/computer-vision/
    // API Documentation: https://westcentralus.dev.cognitive.microsoft.com/docs/services/5adf991815e1060e6355ad44/operations/56f91f2e778daf14a499e1fa
    function takeAndAnalyzePicture() {
        picture = document.getElementById("picture");
        const canvas = picture.getContext("2d");
        canvas.drawImage(document.getElementById("webcam"), 0, 0, picture.width, picture.height);

        canvas.lineWidth = 2;
        canvas.textAlign = "center";
        canvas.font = "14px Arial";

        // Provide your own Microsoft Azure endpoint and subscription key here:
        const endpoint = "https://picture-analysis.cognitiveservices.azure.com";
        const subscriptionKey = "9f2e1a388ec24d40bc1ebb9f2c40e646";

        $.ajax({
            type: "POST",
            url : endpoint + "/vision/v2.0/analyze?visualFeatures=Color,Description,Faces,Objects,Tags",
            headers: {
                "Content-Type": "application/octet-stream",
                "Ocp-Apim-Subscription-Key": subscriptionKey
            },
            data : dataURLtoBlob(picture.toDataURL("image/jpeg")),
            processData: false
        }).done(function(data) {
            console.info(JSON.stringify(data));
            console.info(data);

            // Accent Color
            document.body.style.backgroundColor = "#" + data.color.accentColor;
            document.body.style.color = pickTextColorBasedOnBgColor(data.color.accentColor, "white", "black");

            // Caption
            const caption = data.description.captions[0];
            $("#caption").text(caption.text + " (Confidence: " + numberToPercentageString(caption.confidence) + ")")

            // Tags
            $("#tags").show();
            $(".added").remove();
            data.tags.forEach((tag) => $("#tags").append("<tr class=\"added\"><td>" + tag.name + "</td><td>" + numberToPercentageString(tag.confidence) + "</td></tr>"));

            // Faces
            canvas.strokeStyle = "red";
            canvas.fillStyle = "red";
            data.faces.forEach((face) => {
                const rect = face.faceRectangle;
                canvas.strokeRect(rect.left, rect.top, rect.width, rect.height);
                canvas.fillText(face.gender + " " + face.age, rect.left + (rect.width / 2), rect.top - 8);
            });

            // Objects
            canvas.strokeStyle = "blue";
            canvas.fillStyle = "blue";
            data.objects.forEach((object) => {
                const rect = object.rectangle;
                canvas.strokeRect(rect.x, rect.y, rect.w, rect.h);
                canvas.fillText(object.object + " (" + numberToPercentageString(object.confidence) + ")", rect.x + (rect.w / 2), rect.y - 8);
            });
        }).fail(function(data) {
            console.error(JSON.stringify(data));
        });
    }

    $("#webcam").click(takeAndAnalyzePicture);
});
