
Install pinokio

```bash
yay -S pinokio-bin
```

Install huggingface_hub

By colab:

https://medium.com/@IbrahimMalick/my-electrifying-weekend-with-wan2-1-the-open-source-revolution-in-ai-video-creation-c24197402121

```bash
pip install -U "huggingface_hub[cli]"
```

```bash
huggingface-cli download Wan-AI/Wan2.1-T2V-14B --local-dir ./checkpoints/ --resume-download   --include "config.json" --include "diffusion_pytorch_model-00001-of-00006.safetensors" --include "diffusion_pytorch_model-00002-of-00006.safetensors" --include "diffusion_pytorch_model-00003-of-00006.safetensors" --include "diffusion_pytorch_model-00004-of-00006.safetensors" --include "diffusion_pytorch_model-00005-of-00006.safetensors" --include "diffusion_pytorch_model-00006-of-00006.safetensors" --include "diffusion_pytorch_model.safetensors.index.json" --include "models_t5_umt5-xxl-enc-bf16.pth" --include "Wan2.1_VAE.pth"
```