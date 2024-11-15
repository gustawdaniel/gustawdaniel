---
title: How to benchmark CUDA in Python?
publishDate: 2024-10-26
---

Clone repository with benchmarks

```bash
git clone git@github.com:gustawdaniel/cuda-benchmark-python.git
cd cuda-benchmark-python
```

Create conda environment

```bash
conda create -n cuda-benchmark python=3.10
conda activate cuda-benchmark
```

Install pytorch using link: https://pytorch.org/get-started/locally/

First check your cuda version by `nvidia-smi`. For example.:

```bash
nvidia-smi
```

In my case it is

```
CUDA Version: 12.6 
```

You can check by `nvcc --version`:

```bash
nvcc --version
```

For example:

```
Cuda compilation tools, release 12.6, V12.6.77
```

If you do not have installed these packages check wiki https://wiki.archlinux.org/title/GPGPU#CUDA

```bash
yay -S nvidia cuda nvidia-utils
```

Last one is optional, but beneficial for most users. If you still do not have access to `nvcc` add following to `~/.bashrc` or `~/.zshrc`:

```bash
export PATH=/opt/cuda/bin:$PATH
```

and reload terminal.

Unfortunately there is no pytorch for cuda 12.6. So I will use 12.4

```bash
conda install pytorch torchvision torchaudio pytorch-cuda=12.4 -c pytorch -c nvidia
```

Now you can run benchmarks

```bash
python main.py
```

It can be useful to check your cpu or gpu models. You can do it by:

```bash
lscpu | grep 'Model name'
```

Exemplary output:

```
Model name:                           12th Gen Intel(R) Core(TM) i7-12700H
```

or

```
Model name:                           AMD Ryzen 9 7945HX with Radeon Graphics
```

For gpu:

```bash
nvidia-smi --query-gpu=name --format=csv,noheader
```

Exemplary output:

```
NVIDIA GeForce RTX 3060 Laptop GPU
```

or

```
NVIDIA GeForce RTX 4090 Laptop GPU
```

there are my results form benchmark:

```
CUDA is available. Benchmark matrix 10000x10000 multiplied 10 times.
CPU Model: 12th Gen Intel(R) Core(TM) i7-12700H
GPU Model: NVIDIA GeForce RTX 3060 Laptop GPU
CPU Benchmark Duration: 33.20103993 seconds
GPU Benchmark Duration: 2.38760203 seconds
Speedup: 13.9056x faster on GPU
```

```
CUDA is available. Benchmark matrix 10000x10000 multiplied 10 times.
CPU Model: AMD Ryzen 9 7945HX with Radeon Graphics
GPU Model: NVIDIA GeForce RTX 4090 Laptop GPU
CPU Benchmark Duration: 16.88850302 seconds
GPU Benchmark Duration: 1.13820602 seconds
Speedup: 14.8378x faster on GPU
```

Recommended tools to monitor results:

```
btop
nvtop
```