---
title: Cuda执行模型
date: 2026-06-12 16:30:00
tags:
  - AI Infra
categories:
  - Kernel
excerpt: 梳理 CUDA 从 Host 发起 kernel 到 Grid、Block、Thread、Warp、SM 的执行层次，作为理解 GPU Kernel 优化的起点。
---

## 1. CUDA 执行模型的整体理解

CUDA 的执行模型可以概括为：

> CPU 发起任务，GPU 使用大量线程并行执行任务。

在 CUDA 程序中，CPU 端代码通常被称为 **Host 代码**，GPU 端代码通常被称为 **Device 代码**。  
当 CPU 调用一个 GPU 函数时，这个 GPU 函数被称为 **kernel**。

CUDA 执行层次可以理解为：

```text
Host(CPU)
  ↓ launch kernel
Grid
  ↓
Block
  ↓
Thread
  ↓
Warp
  ↓
SM
```

需要注意的是：

- 编程时，我们主要看到的是 `grid / block / thread`；
- 硬件执行时，GPU 实际上以 `warp` 为基本调度单位；
- `warp` 会被调度到 GPU 芯片上的 `SM` 中执行。

<!-- more -->

---

## 2. Kernel：GPU 上执行的函数

CUDA 中的 kernel 是运行在 GPU 上的函数。

例如：

```cpp
__global__ void add(float* a, float* b, float* c, int n) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;

    if (idx < n) {
        c[idx] = a[idx] + b[idx];
    }
}
```

在 CPU 端启动 kernel：

```cpp
add<<<gridDim, blockDim>>>(a, b, c, n);
```

这里的含义是：

```text
启动 add kernel；
启动 gridDim 个 block；
每个 block 中有 blockDim 个 thread。
```

也就是说，一个 kernel 并不是只执行一次，而是由 GPU 上的大量线程同时执行同一份代码。

---

## 3. Grid：一次 kernel launch 的整体线程组织

一次 kernel launch 会生成一个 **Grid**。

可以理解为：

```text
一个 kernel launch 对应一个 grid
```

例如：

```cpp
add<<<4, 256>>>(a, b, c, n);
```

表示：

```text
grid 中有 4 个 block；
每个 block 中有 256 个 thread；
总线程数 = 4 × 256 = 1024。
```

这些线程都会执行同一个 kernel，只是每个线程根据自己的编号处理不同的数据。

---

## 4. Block：线程分组单位

Grid 由多个 Block 组成：

```text
Grid = 多个 Block
```

一个 Block 内的线程有几个重要特点：

- 同一个 Block 内的线程可以共享 **Shared Memory**；
- 同一个 Block 内的线程可以通过 `__syncthreads()` 做同步；
- 一个 Block 通常会被调度到同一个 SM 上执行；
- 不同 Block 之间一般不能直接同步。

例如：

```text
grid
├── block 0
├── block 1
├── block 2
└── block 3
```

如果每个 block 有 256 个 thread，那么每个 block 内部又可以继续拆成多个 warp。

---

## 5. Thread：CUDA 编程中的基本执行单元

Thread 是 CUDA 编程模型中最小的逻辑执行单元。

在向量加法中，每个 thread 可以负责处理一个元素：

```cpp
int idx = blockIdx.x * blockDim.x + threadIdx.x;

if (idx < n) {
    c[idx] = a[idx] + b[idx];
}
```

其中：

```text
blockIdx.x：当前 block 在 grid 中的编号
blockDim.x：每个 block 中有多少个 thread
threadIdx.x：当前 thread 在 block 内的编号
idx：当前 thread 负责处理的数据下标
```

因此：

```cpp
int idx = blockIdx.x * blockDim.x + threadIdx.x;
```

本质上是在计算：

```text
当前线程在整个 grid 中的全局线程编号
```

---

## 6. Warp：GPU 实际调度线程的基本单位

虽然我们写 CUDA 代码时关注的是 thread，但 GPU 硬件调度时并不是一个 thread 一个 thread 地调度，而是以 **warp** 为单位调度。

通常：

```text
1 个 warp = 32 个 thread
```

也就是说，如果一个 block 中有 256 个 thread，那么它会被划分成：

```text
256 / 32 = 8 个 warp
```

可以理解为：

```text
block
├── warp 0: thread 0  ~ 31
├── warp 1: thread 32 ~ 63
├── warp 2: thread 64 ~ 95
└── ...
```

GPU 硬件真正调度执行时，是让一个个 warp 在 SM 上执行。

---

## 7. SIMT：Single Instruction, Multiple Threads

CUDA 的 warp 执行模型通常被称为 **SIMT**：

```text
Single Instruction, Multiple Threads
```

意思是：

```text
同一个 warp 内的多个 thread 通常执行同一条指令；
但是每个 thread 处理自己的数据。
```

例如：

```cpp
c[idx] = a[idx] + b[idx];
```

对于一个 warp 来说，可以理解为：

```text
32 个 thread 同时执行加法指令；
每个 thread 的 idx 不同；
每个 thread 读取不同的 a[idx] 和 b[idx]；
每个 thread 写入不同的 c[idx]。
```

所以 CUDA 的并行不是每个线程执行完全不同的逻辑，而是大量线程执行相同的程序，只是处理不同的数据。

---

## 8. SM：GPU 上真正执行计算的硬件单元

GPU 由多个 **SM** 组成，SM 可以粗略理解为 GPU 上真正干活的计算单元。

```text
GPU = 多个 SM
SM = 执行 block / warp 的硬件单元
```

当启动一个 kernel 后，CUDA 会把 grid 中的 block 分配给不同的 SM。

例如：

```text
block 0 -> SM 0
block 1 -> SM 1
block 2 -> SM 2
block 3 -> SM 0
...
```

一个 SM 内部可以简化理解为：

```text
SM
├── Warp Scheduler
├── Register File
├── Shared Memory / L1 Cache
├── CUDA Cores
├── Tensor Cores
├── Load / Store Unit
└── Active Warps
```

其中：

- **Warp Scheduler**：选择哪个 ready warp 发射下一条指令；
- **CUDA Cores**：执行普通 FP32 / INT 等计算；
- **Tensor Cores**：执行矩阵乘加等高吞吐计算；
- **Load / Store Unit**：负责访存；
- **Shared Memory**：Block 内线程共享的高速内存。

---

## 9. Warp 和 SM、指令调度的关系

Warp 这个概念本质上和 GPU 芯片上的 SM、指令调度器、SIMT 执行模型强相关。

执行过程可以简化为：

```text
某个 block 被调度到 SM
        ↓
block 内 thread 被划分成多个 warp
        ↓
SM 内的 warp scheduler 选择一个 ready warp
        ↓
发射一条指令
        ↓
warp 内 32 个 thread 执行同一条指令
        ↓
每个 thread 处理自己的数据
```

因此，虽然 CUDA 代码是按 thread 写的，但 GPU 硬件实际是按 warp 进行调度和执行的。

---

## 10. Warp Divergence：分支发散

如果同一个 warp 内的线程走了不同的分支，就会出现 **warp divergence**。

例如：

```cpp
if (threadIdx.x % 2 == 0) {
    // A 路径
} else {
    // B 路径
}
```

在同一个 warp 中：

```text
部分 thread 走 A 路径；
部分 thread 走 B 路径。
```

但是 warp 内线程通常应该执行同一条指令，所以 GPU 可能会：

```text
先执行 A 路径，屏蔽 B 路径线程；
再执行 B 路径，屏蔽 A 路径线程。
```

这样原本可以并行执行的一组线程，被拆成多批执行，导致性能下降。

所以在 CUDA kernel 优化中，通常要尽量避免同一个 warp 内出现严重的分支发散。

---

## 11. 用向量加法串起来理解

假设有 1024 个元素需要相加：

```cpp
c[i] = a[i] + b[i]
```

可以设置：

```cpp
blockDim = 256
gridDim = 4
```

那么：

```text
一共 4 个 block；
每个 block 256 个 thread；
总共 1024 个 thread；
每个 thread 负责处理一个元素。
```

具体划分为：

```text
block 0 处理 idx = 0   ~ 255
block 1 处理 idx = 256 ~ 511
block 2 处理 idx = 512 ~ 767
block 3 处理 idx = 768 ~ 1023
```

每个 block 内部又会被划分成多个 warp：

```text
每个 block 256 个 thread
每个 warp 32 个 thread
所以每个 block = 8 个 warp
```

然后这些 warp 会在 SM 上被调度执行。

---

## 12. CUDA 执行模型总结

可以用一句话总结 CUDA 执行模型：

> CPU 端发起 kernel launch，GPU 端生成一个 grid；grid 由多个 block 组成，block 由多个 thread 组成；block 会被调度到 SM 上执行，而 SM 实际以 warp 为单位调度线程；一个 warp 通常包含 32 个 thread，warp 内线程按照 SIMT 模型执行同一条指令、处理不同数据。

更加工程化地说：

```text
CUDA 编程视角：
kernel → grid → block → thread

GPU 硬件执行视角：
kernel → grid → block → warp → SM → 指令执行
```

---

## 13. 面试中可以这样回答

如果面试官问：**CUDA 的执行模型是什么？**

可以这样回答：

> CUDA 中，CPU 端通过 kernel launch 启动 GPU 计算任务。一次 kernel launch 会生成一个 grid，grid 由多个 block 组成，每个 block 中包含多个 thread。每个 thread 通过 blockIdx、blockDim 和 threadIdx 计算自己的全局编号，从而处理不同的数据。  
> 
> 从硬件执行角度看，block 会被调度到 GPU 的 SM 上执行，而 SM 实际是以 warp 为基本单位调度线程的。一个 warp 通常包含 32 个 thread，warp 内线程按照 SIMT 模型执行同一条指令、处理不同数据。因此在 CUDA kernel 优化中，需要关注 warp divergence、访存合并、shared memory、register 使用量和 occupancy 等问题。

---

## 14. 后续需要继续补充的优化概念

掌握执行模型之后，后续可以继续学习以下 CUDA 优化概念：

```text
memory coalescing：访存合并
shared memory：共享内存
register：寄存器
occupancy：SM 占用率
warp divergence：warp 分支发散
bank conflict：shared memory bank 冲突
kernel launch overhead：kernel 启动开销
CUDA stream：异步执行与并发
CUDA graph：减少 kernel launch 开销
Tensor Core：矩阵乘加加速单元
```

这些概念是从“能写 CUDA kernel”走向“能优化 CUDA kernel”的关键。
