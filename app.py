from flask import Flask, render_template, request, jsonify
from gradio_client import Client, handle_file
from PIL import Image
from io import BytesIO
import base64
import requests
import random
import os

app = Flask(__name__)

HF_TOKEN = os.environ.get("HF_TOKEN")
IMGBB_API_KEY = os.environ.get("IMGBB_API_KEY")

os.environ['GRADIO_CLIENT_AUTH_TOKEN'] = HF_TOKEN

# Upload image to ImgBB
def upload_to_imgbb(image_path):
    with open(image_path, "rb") as file:
        response = requests.post(
            "https://api.imgbb.com/1/upload",
            data={"key": IMGBB_API_KEY},
            files={"image": file},
        )
    if response.status_code == 200:
        return response.json()["data"]["url"]
    else:
        raise Exception("Failed to upload image to ImgBB")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/style_transformation', methods=['POST'])
def style_transformation():
    try:
        image = request.files['image']
        prompt = request.form['prompt']
        filename = "uploaded_image.jpg"
        image.save(filename)
        seed = random.randint(1_000_000, 2147483647)

        client = Client("hysts/ControlNet-v1-1")
        result = client.predict(
            image=handle_file(filename),
            prompt=prompt,
            additional_prompt="best quality, extremely detailed",
            negative_prompt="longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, cropped, worst quality, low quality",
            num_images=1,
            image_resolution=768,
            num_steps=100,
            guidance_scale=9,
            seed=seed,
            low_threshold=1,
            high_threshold=255,
            api_name="/canny"
        )

        image_path = result[1].get("image")
        if not image_path.startswith("http"):
            img_url = upload_to_imgbb(image_path)
        else:
            img_url = image_path

        return jsonify({"url": img_url})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/caption', methods=['POST'])
def caption():
    try:
        image = request.files['image']
        filename = "uploaded_image.jpg"
        image.save(filename)

        client = Client("hysts/image-captioning-with-blip")
        result = client.predict(image=handle_file(filename), text="A picture of", api_name="/caption")
        return jsonify({"caption": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/enhance_image', methods=['POST'])
def enhance_image():
    try:
        image = request.files['image']
        filename = "uploaded_image.jpg"
        image.save(filename)
        seed = 42

        client = Client("finegrain/finegrain-image-enhancer")
        result = client.predict(
            input_image=handle_file(filename),
            prompt="masterpiece, best quality, highres",
            negative_prompt="worst quality, low quality, normal quality",
            seed=seed,
            upscale_factor=2,
            controlnet_scale=0.6,
            controlnet_decay=1,
            condition_scale=6,
            tile_width=112,
            tile_height=144,
            denoise_strength=0.35,
            num_inference_steps=30,
            solver="DPMSolver",
            api_name="/process"
        )

        enhanced_path = result[1]
        img_url = upload_to_imgbb(enhanced_path)
        return jsonify({"url": img_url})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
