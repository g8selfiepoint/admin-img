<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>View Images - Charvik Programs</title>
  <style>
    body {
      font-family: 'Poppins', sans-serif;
      background-color: #000;
      color: #00aaff;
      text-align: center;
      margin: 0;
      padding: 40px 20px;
    }
    h1 {
      font-size: 2.2em;
      color: #00aaff;
      text-shadow: 0 0 10px #007bff;
    }
    input {
      padding: 12px;
      font-size: 1.2em;
      border-radius: 8px;
      border: 2px solid #007bff;
      width: 180px;
      text-align: center;
      background: #111;
      color: white;
      margin-top: 20px;
    }
    button {
      background-color: #007bff;
      color: white;
      border: none;
      padding: 12px 25px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1em;
      margin-left: 10px;
      transition: 0.3s;
    }
    button:hover {
      background-color: #00aaff;
      box-shadow: 0 0 10px #00aaff;
    }
    .gallery {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 20px;
      margin-top: 30px;
    }
    .gallery img {
      width: 250px;
      height: 180px;
      object-fit: cover;
      border-radius: 10px;
      border: 2px solid #00aaff;
      transition: transform 0.3s;
    }
    .gallery img:hover {
      transform: scale(1.05);
    }
    .message {
      color: #ff4444;
      margin-top: 20px;
    }
  </style>
</head>
<body>

<h1>🖼️ View Uploaded Photos</h1>
<p>Enter your 5-digit code to view the images:</p>

<input type="text" id="codeInput" maxlength="5" placeholder="Enter code">
<button onclick="fetchPhotos()">View</button>

<div id="output" class="message"></div>
<div class="gallery" id="gallery"></div>

<script>
async function fetchPhotos() {
  const code = document.getElementById("codeInput").value.trim();
  const output = document.getElementById("output");
  const gallery = document.getElementById("gallery");
  output.textContent = "";
  gallery.innerHTML = "";

  if (!code) {
    output.textContent = "⚠️ Please enter a valid code.";
    return;
  }

  output.textContent = "Loading images...";

  try {
    const response = await fetch(`https://admin-img-backend.onrender.com/get-photos/${code}`);
    const data = await response.json();

    if (data.success && data.links.length > 0) {
      output.textContent = `✅ Found ${data.links.length} image(s) for code ${code}`;
      data.links.forEach(link => {
        const img = document.createElement("img");
        img.src = link;
        img.alt = "Uploaded photo";
        gallery.appendChild(img);
      });
    } else {
      output.textContent = "❌ Invalid or expired code. No images found.";
    }
  } catch (error) {
    console.error(error);
    output.textContent = "⚠️ Error fetching images.";
  }
}
</script>

</body>
</html>
