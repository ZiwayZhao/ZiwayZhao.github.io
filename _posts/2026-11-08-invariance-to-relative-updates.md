---
layout: "post"
title: "从缩放不变性要求推导优化器"
date: "2026-11-08 12:00:00 +0800"
description: "从参数缩放协变性与损失缩放不变性出发，构造相对更新，并理解 ELR 与学习率系数的关系。"
lang: "zh-CN"
permalink: "/blog/2026/invariance-to-relative-updates/"
tags: ["optimization", "elr"]
categories: ["research-notes"]
featured: true
related_posts: false
giscus_comments: false
disqus_comments: false
comment_key: "blog1"
toc: {"beginning": true}
_styles: ".blog-series { margin: 1.25rem 0 2rem; padding: 1rem 1.25rem; border: 1px solid var(--global-divider-color, #d8dde3); border-radius: .65rem; font-size: .95rem; }\n.blog-series a { margin-right: 1rem; }\n.blog-feedback { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid var(--global-divider-color, #d8dde3); }\n.blog-feedback form { display: grid; gap: 1rem; margin-top: 1.5rem; }\n.blog-feedback label { display: grid; gap: .4rem; }\n.blog-feedback input, .blog-feedback textarea { width: 100%; border: 1px solid var(--global-divider-color, #a9b1bb); border-radius: .4rem; padding: .65rem .8rem; color: inherit; background: var(--global-bg-color, #fff); font: inherit; }\n.blog-feedback textarea { min-height: 10rem; resize: vertical; }\n.blog-feedback .consent { display: flex; align-items: flex-start; gap: .6rem; }\n.blog-feedback .consent input { width: 1.1rem; height: 1.1rem; flex-shrink: 0; margin-top: .2rem; }\n.blog-feedback button { justify-self: start; border: 1px solid var(--global-theme-color, #6653a6); border-radius: .4rem; padding: .65rem 1.2rem; background: var(--global-theme-color, #6653a6); color: #fff; font: inherit; cursor: pointer; }\n.blog-feedback input:focus-visible, .blog-feedback textarea:focus-visible, .blog-feedback button:focus-visible { outline: 2px solid var(--global-theme-color, #6653a6); outline-offset: 3px; }\n.blog-feedback .feedback-note { font-size: .9rem; color: var(--global-text-color-light, #697386); }\n.blog-selected-comment { margin: 1.25rem 0; padding: 1rem 1.25rem; border: 1px solid var(--global-divider-color, #d8dde3); border-radius: .5rem; }\n.blog-selected-comment .author-reply { margin-top: 1rem; padding-left: 1rem; border-left: 3px solid var(--global-theme-color, #6653a6); }\n.post-content img[src*=\"/blog/relative-updates/\"] { max-width: 100%; height: auto; background: #fff; border-radius: .4rem; }"
---

<nav class="blog-series" aria-label="相对更新系列">
  <strong>相对更新系列</strong><br>
  <a href="{{ '/blog/2026/invariance-to-relative-updates/' | relative_url }}">blog1 · 从缩放不变性要求推导优化器</a>
  <a href="{{ '/blog/2026/relative-updates-and-hypersphere/' | relative_url }}">blog2 · 相对更新之后：超球面约束额外改变了什么？</a>
</nav>

<!-- article-source:start -->
同一个函数可以有两种参数化写法：一种直接用参数 *w*，另一种存 *ŵ = cw*，并在前向中除回 *c*。只要参数对应，它们就 functionally equivalent：

$$
\hat\ell(\hat w)=\ell\!\left(\underbrace{\hat w/c}_{\text{换回参数 }w}\right).
$$

这像用米和厘米记同一段长度，例如 *ℓ(w)=w²*、*c=10* 时，*ℓ̂(ŵ)=ŵ²/100*。比较 *ℓ(3)=9* 与 *ℓ̂(3)=0.09*，结果不同，**因为 *w=3* 与 *ŵ=3* 不是对应参数**。若 *w=3*，对应的是 *ŵ=cw=30*，因此应该比较 *ℓ(3)=9=ℓ̂(30)*。一般地，恒有 *ℓ̂(cw)=ℓ(w)*。模型前向也按同样方式改写，所以在 *ŵ=cw* 下，对任意模型输入 *x* 的预测相同。

## 参数换一种表示，SGD 的更新就变了

用 SGD，取 *c=10*，两边同样设学习率 *η*：训练 *ℓ(w)* 时，*w* 每步走 *η* 倍梯度；训练 *ℓ̂(ŵ)=ℓ(ŵ/10)* 时，映回 *w* 却只走原来的百分之一。模型没变，映回原坐标后的一步位移只有原来的百分之一。

现在用同一个学习率 *η* 各走一步。在 *ℓ̂(ŵ)=ℓ(ŵ/c)* 下，*w* 的变化会被缩小两次：

1. 梯度小了 c 倍：单位变小后，参数每变化 1，对损失的影响也变小，所以 *∇ℓ̂(ŵ)=g/c*。
2. 换算回去又小了 c 倍：在 *ŵ* 上走的距离，要除以 *c* 才是 *w* 上走的距离。

所以：

$$
\hat w_{t+1}=\hat w_t-\eta\,g_t/c
\quad\Rightarrow\quad
w_{t+1}=w_t-c^{-2}\eta g_t.
$$

也就是说，换成 *ℓ̂* 后，SGD 的实际学习率变成原来的 *c⁻²* 倍，如果想要训练轨迹一致，还要把新的学习率放大回去。

## 各块缩放不同，学习率就要分别补偿

现在把刚才的单块结论分别用于两个参数块。 *c_A=10*， *c_B=2*。损失是 *ℓ=A²+B²*，当前 *A=3*、*B=4*。A 块存成 *Â=10A=30*，B 块存成 *B̂=2B=8*。

$$
\hat\ell(\hat A,\hat B)=(\hat A/10)^2+(\hat B/2)^2.
$$

对 *ℓ(A,B)* 和 *ℓ̂(Â,B̂)* 分别求梯度：

$$
\nabla\ell(A,B)=(2A,2B)=(6,8),\qquad
\nabla\hat\ell(\hat A,\hat B)=(2\hat A/100,2\hat B/4)=(0.6,4).
$$

|  | **ℓ：A** | **ℓ̂：Â** | **ℓ：B** | **ℓ̂：B̂** |
| --- | --- | --- | --- | --- |
| 参数 | 3 | 30 | 4 | 8 |
| 梯度 | 6 | 0.6 | 8 | 4 |
| SGD 走一步、映回原坐标 | 2.4 | 2.994 | 3.2 | 3.8 |
| 要追平 ℓ，学习率该乘 | — | 100 | — | 4 |

SGD 的公式： *w ← w−ηg*，例如 *η=10⁻¹*：

$$
\hat A\leftarrow30-(100\eta)\cdot0.6=24,\qquad A=24/10=2.4,
$$

$$
\hat B\leftarrow8-(4\eta)\cdot4=6.4,\qquad B=6.4/2=3.2.
$$

要让 *ℓ* 与 *ℓ̂* 的 SGD 轨迹对应，A 块的学习率需要乘 *c_A²=100*，B 块需要乘 *c_B²=4*。换一种参数表示，就要分别补偿各块的学习率。

能不能把这种补偿交给优化器自己完成？我们希望对 A、B 使用同一个学习率，由优化器根据各块当前的参数和梯度计算更新，不必再额外告诉它 *c_A、c_B* 是多少。这样，从 *Â₀=c_A A₀、B̂₀=c_B B₀* 出发，每一步更新后仍然保持：

$$
\hat A_t=c_A A_t,\qquad \hat B_t=c_B B_t.
$$

也就是说，两种参数表示下的数值可以不同，但把 *Â、B̂* 分别除回各自的缩放倍数后，得到的参数轨迹始终一致。下面先对一个参数块推导需要怎样的更新规则，再将它分别用于 A、B。

## 让更新保持对应：参数缩放协变性

不管用什么优化器，一步更新都可以写成 *w ← w−φ*，其中 *φ* 是实际更新量。不考虑权重衰减时，常见优化器可写成 *φ=ηu*，比如 SGD 的 *u* 是梯度 *g*，Adam 的 *u* 是 *m/√v*。
要让轨迹一致，φ 该满足什么？我们从一步更新来看。新写法在前向时用的是 ŵ/c，所以两种写法要表示同一个函数，每一步都必须满足 ŵt = c wt。第0步时默认成立，假设第 t 步这个关系成立，两种写法的更新分别是：

$$
w_{t+1}=w_t-\phi,\qquad \hat w_{t+1}=\hat w_t-\hat\phi.
$$

第 *t+1* 步继续满足 *ŵₜ₊₁=cwₜ₊₁* 当且仅当：

$$
\hat w_t-\hat\phi=c(w_t-\phi)=\hat w_t-c\phi
\quad\Rightarrow\quad
\boxed{\hat\phi=c\phi.}
$$

也就是说，**ℓ̂ 的更新量必须是 ℓ 的 c 倍，即 φ̂=cφ。**反过来，从 *ŵ₀=cw₀* 出发，只要每一步满足 *φ̂=cφ*，就能一直保持 *ŵₜ=cwₜ*。

优化器是输入当前参数和梯度、输出更新量的函数，记作 *φ(w,g)*，其中 *g=∇ℓ(w)*。对 *ℓ̂(ŵ)=ℓ(ŵ/c)*，链式法则给出：

$$
z_j=\hat w_j/c,\qquad \hat\ell(\hat w)=\ell(z_1,\ldots,z_n).
$$

先固定一个 *i*，看 *ŵᵢ* 变化时，会通过哪些 *zⱼ* 影响损失。

$$
\frac{\partial\hat\ell}{\partial\hat w_i}
=\sum_{j=1}^n
\underbrace{\frac{\partial\ell}{\partial z_j}}_{\text{损失对 }z_j\text{ 的变化率}}
\underbrace{\frac{\partial z_j}{\partial\hat w_i}}_{\hat w_i\text{ 对 }z_j\text{ 的影响}}.
$$

因为 *c* 是固定常数，而且 *zⱼ=ŵⱼ/c*，所以对 *ŵᵢ* 求偏导时：

$$
\frac{\partial z_j}{\partial\hat w_i}
=\frac1c\frac{\partial\hat w_j}{\partial\hat w_i}
=\begin{cases}
1/c,&j=i,\\
0,&j\ne i.
\end{cases}
$$

（例外：需要检查重新参数化的具体形式，若改成 *z₁=ŵ₁+ŵ₂*，那么改变 *ŵ₂* 也会影响 *z₁*，也就是权重之间的相对大小 matters）

把求和中 *j=i* 的那一项单独拿出来：

$$
\begin{aligned}
\frac{\partial\hat\ell}{\partial\hat w_i}
&=\frac{\partial\ell}{\partial z_i}\frac{\partial z_i}{\partial\hat w_i}
+\sum_{j\ne i}\frac{\partial\ell}{\partial z_j}\frac{\partial z_j}{\partial\hat w_i}\\
&=\frac{\partial\ell}{\partial z_i}\cdot\frac1c
+\sum_{j\ne i}\frac{\partial\ell}{\partial z_j}\cdot0\\
&=\frac1c\frac{\partial\ell}{\partial z_i}.
\end{aligned}
$$

每个 *zⱼ* 只依赖对应的 *ŵⱼ*，所以只有 *j=i* 的一项不为零。上式对每个 *i* 都成立，故：

$$
\nabla_{\hat w}\hat\ell(\hat w)=g/c.
$$

于是 *φ̂=φ(cw,g/c)*。代入 *φ̂=cφ*，就得到参数缩放协变性对优化器提出的要求：

$$
\boxed{\phi(cw,g/c)=c\phi(w,g).}
$$

### 保留梯度方向，构造幂函数族

我们先从熟悉的 SGD 出发。它的更新量是：

$$
\phi(w,g)=\eta g.
$$

由 *ℓ* 改用 *ℓ̂*，即 *(w,g)→(cw,g/c)* 时，SGD 的更新量变成 *ηg/c*，而参数缩放协变性要求它变成 *cηg*。那我们能不能先保留梯度给出的方向，只给更新量补上一个尺度系数？写成：

$$
\phi(w,g)=\underbrace{\eta\,s(w,g)}_{\text{标量系数}}\,\underbrace{g}_{\text{梯度向量}}.
$$

这里用标量 *s(w,g)* 乘梯度向量，使得更新量与当前梯度共线。若 *s>0*，实际参数变化 *−φ* 就沿负梯度方向。

把它代入参数缩放协变性的条件（先考虑 *w,g≠0*）：

$$
\eta\,s(cw,g/c)\,g/c=c\eta\,s(w,g)\,g
\quad\Rightarrow\quad
s(cw,g/c)=c^2s(w,g).
$$

所以，我们要找的系数需要从当前参数和梯度补上 *c²* 这个倍数。

我们研究的正是参数尺度变化，因此一个自然的起点是：先只用权重和梯度的模长来算这个系数：

$$
s(w,g)=S(\lVert w\rVert,\lVert g\rVert).
$$

我们暂时不用权重和梯度的方向信息，比如它们之间的夹角。这样就把向量问题变成了两个正数的问题。

接着，为了方便求解，先尝试幂函数形式。因为模长乘上一个常数后，幂函数的变化可以直接用指数算出来：

$$
S(r,q)=r^a q^b.
$$

于是得到我们的**构造假设**：更新与当前梯度共线，并且更新的缩放只通过 *‖w‖*、*‖g‖* 的幂次进入。写成：

$$
\phi(w,g)=\eta\lVert w\rVert^a\lVert g\rVert^b g.
$$

将 *ℓ→ℓ̂* 对应的 *(w,g)→(cw,g/c)* 代入：

$$
\begin{aligned}
\phi(cw,g/c)
&=\eta\lVert cw\rVert^a\lVert g/c\rVert^b(g/c)\\
&=\underbrace{c^a}_{\text{权重模长}}\,
\underbrace{c^{-b}}_{\text{梯度模长}}\,
\underbrace{c^{-1}}_{\text{梯度向量}}\,
\eta\lVert w\rVert^a\lVert g\rVert^b g\\
&=c^{a-b-1}\phi(w,g).
\end{aligned}
$$

而参数缩放协变性要求它等于 *cφ(w,g)*，所以：

$$
a-b-1=1\qquad\Longleftrightarrow\qquad a-b=2.
$$

一个方程有一族解。令 *b=p−1*，那么 *a=p+1*，得到：

$$
\boxed{\phi_p(w,g)=\eta\lVert w\rVert^{p+1}\lVert g\rVert^{p-1}g,\qquad p\in\mathbb R.}
$$

所以，在这个“梯度共线 + 幂次缩放”的构造族中，**任意 *p* 都满足参数缩放协变性**。

## 损失整体缩放，更新能否保持不变？

到这里，我们已经找到一族能处理 *ℓ→ℓ̂* 的更新规则，但 *p* 还没有确定。再看另一种变化：将 *ℓ(w)* 换成 *ℓ̄(w)=kℓ(w)*，其中 *k>0*。参数、预测和数据不变，只改变损失的整体倍数。

比如，同一批有 *N* 个样本，每个样本的损失是 *ℓⱼ(w)*。我们可以把它们求平均，也可以直接求和：

$$
\ell_{\mathrm{mean}}(w)=\frac1N\sum_{j=1}^N\ell_j(w),\qquad
\ell_{\mathrm{sum}}(w)=\sum_{j=1}^N\ell_j(w)=N\ell_{\mathrm{mean}}(w).
$$

因为 *ℓ_sum=Nℓ_mean*、*N>0*，让两个损失达到最低的 *w* 相同：

$$
\arg\min_w\ell_{\mathrm{sum}}(w)=\arg\min_w\ell_{\mathrm{mean}}(w).
$$

但梯度也满足 *∇ℓ_sum=N∇ℓ_mean*。普通 SGD 用同一个学习率更新时，*ℓ_sum* 下的更新长度是 *ℓ_mean* 下的 *N* 倍。和第一个要求类似，若想恢复相同更新，需要把 *ℓ_sum* 的学习率除以 *N*。

前面比较 *ℓ(w)* 与 *ℓ̂(ŵ)*，这里比较 *ℓ_mean(w)* 与 *ℓ_sum(w)*。**我们希望同一套超参数也能处理后一种变化，不必仅仅因为从平均改成求和，就重新补偿学习率。**

一般地，把整个损失乘正常数 *k>0*，记作 *ℓ̄(w)=kℓ(w)*，参数 *w* 不变，梯度变成 *kg*。为了让这次更新轨迹与原来完全一样，我们提出第二个要求——损失缩放不变性：

$$
\boxed{\phi(w,kg)=\phi(w,g).}
$$

两个要求处理的变换不同：

$$
\begin{aligned}
\ell\to\hat\ell:&\qquad (w,g)\mapsto(cw,g/c),\\
\ell\to\bar\ell=k\ell:&\qquad (w,g)\mapsto(w,kg).
\end{aligned}
$$

所以参数缩放协变性没有自动解决损失缩放的问题。满足这两个要求，是我们为了减少尺度补偿而选择的设计目标。

### 两个要求，选出怎样的相对更新？

现在回到刚才还没确定的 *p*。把损失缩放后的梯度代入幂函数族：

$$
\phi_p(w,kg)=\eta\lVert w\rVert^{p+1}\lVert kg\rVert^{p-1}(kg)=k^p\phi_p(w,g).
$$

若要对任意 *k>0* 满足损失缩放不变性，且更新不恒为零，必须有 *k^p=1*，所以：

$$
\boxed{p=0,\qquad \phi_0(w,g)=\eta\lVert w\rVert\frac{g}{\lVert g\rVert}.}
$$

*p=0* 是**刚才这个幂函数族中**同时满足两个缩放要求的唯一非零选择，但不是所有优化器中的唯一解。

损失缩放不变性针对的是整个损失的统一倍数，但不是所有类型的缩放都应该保持不变性。
（例如 *ℓ=ℓ₁+λℓ₂* 中，只改变 *λ* 会改变两个目标的相对重要性，优化器可以忽略整个损失的计分倍数，但不应因此忽略不同训练目标之间的权重变化。）

从两个要求本身看，利用损失缩放不变性，可以在参数缩放协变性的条件中消去梯度的 *1/c*：

$$
\phi(cw,g)=\phi(cw,g/c)=c\phi(w,g).
$$

因此，两个缩放要求合起来等价于更新对权重一次正齐次、对梯度零次正齐次：

$$
\phi(cw,g)=c\phi(w,g),\qquad\phi(w,kg)=\phi(w,g).
$$

## 保留优化器给出的方向，重新设定更新长度

到这里，我们已经从 SGD 出发，在幂函数族中用两个要求选出了：

$$
\phi_0(w,g)=\eta\lVert w\rVert\frac{g}{\lVert g\rVert}.
$$

变化的方向，由梯度的单位方向 *g/‖g‖* 决定；走多远，由 *η‖w‖* 决定。方向和长度可以分别处理。

那么，方向一定要来自原始梯度吗？前面我们把常见优化器的更新写成 *φ=ηu*：SGD 的 *u* 是 *g*，Adam 则会用历史梯度构造 *u*。沿着刚才的思路，可以继续让优化器决定往哪里走，再用同一个规则决定走多远：

$$
\boxed{\phi=
\underbrace{\eta\lVert w\rVert}_{\text{更新长度}}
\underbrace{\frac{u}{\lVert u\rVert}}_{\text{单位方向}}.}
$$

把 *g/‖g‖* 换成 *u/‖u‖*，就是让优化器给出往哪里走；前面的 *η‖w‖* 决定走多远。

检查 *ℓ→ℓ̂* 时，先看长度：*η‖ŵ‖=η‖cw‖=cη‖w‖*，满足放大 *c* 倍的要求。再看方向：训练 *ℓ* 与 *ℓ̂* 时，优化器分别输出 *u* 与 *û*，需要满足：

$$
\frac{\hat u}{\lVert\hat u\rVert}=\frac{u}{\lVert u\rVert},
$$

涉及历史状态时，也要把状态的变换一起算进去。
方向满足这个关系，就有：

$$
\hat\phi=\eta\lVert cw\rVert\frac{\hat u}{\lVert\hat u\rVert}
=c\eta\lVert w\rVert\frac{u}{\lVert u\rVert}=c\phi.
$$

具体做法是：先让优化器照常算出 *u*，再除以 *‖u‖*，只取它指向哪里；最后乘上 *η‖w‖*，决定这一步走多远。也就是把原先的 *ηu* 换成 *η‖w‖u/‖u‖*。

再检查 *ℓ→ℓ̄=kℓ*。参数 *w* 不变，设优化器输出由 *u* 变成 *u_k*，两次更新为：

$$
\phi=\eta\lVert w\rVert\frac{u}{\lVert u\rVert},\qquad
\phi_k=\eta\lVert w\rVert\frac{u_k}{\lVert u_k\rVert}.
$$

因为 *w* 没有变，两边的更新长度都已经是 *η‖w‖*。要让更新向量也完全相同，剩下的要求就是方向相同：

$$
\frac{u_k}{\lVert u_k\rVert}=\frac{u}{\lVert u\rVert}
\quad\Rightarrow\quad
\phi_k=\phi.
$$

例如 SGD 给出 *u=g*，损失乘 *k* 后给出 *u_k=kg*。由于 *k>0*，归一化会消去这个倍数：

$$
\frac{u_k}{\lVert u_k\rVert}=\frac{kg}{k\lVert g\rVert}=\frac{g}{\lVert g\rVert}.
$$

因此，用 SGD 方向构造的规则同时满足参数缩放协变性和损失缩放不变性。
换用其他优化器时，分别检查 *ℓ→ℓ̂* 和 *ℓ→ℓ̄=kℓ*：前者要求 *û/‖û‖=u/‖u‖*，后者要求 *u_k/‖u_k‖=u/‖u‖*。归一化可以消去 *u* 的正数倍长度变化。

## 用 ELR 看清：η 究竟控制什么？

为了满足参数缩放协变性和损失缩放不变性，我们从普通 SGD 出发，在前面选定的幂函数族中构造了另一条更新规则。

$$
\begin{aligned}
\text{普通 SGD：}\qquad
&\Delta w=-\eta g.\\[1.2em]
\text{满足两个要求的构造：}\qquad
&\Delta w=
-\underbrace{\eta\lVert w\rVert}_{\text{更新长度}}
\underbrace{\frac{g}{\lVert g\rVert}}_{\text{单位方向}}.
\end{aligned}
$$

普通 SGD 中，学习率 ***η*** 乘在梯度 *g* 上；满足不变性要求的构造中，学习率 ***η*** 与 *‖w‖* 相乘，再乘单位方向 *g/‖g‖*。

现在我们想知道：**更新公式改变后，我们设定的 *η* 究竟在控制什么？** 为此，需要根据两条公式各自算出的实际位移 *Δw*，比较它们每步走多远。

发现：训练 *ℓ* 与 *ℓ̂* 时，我们希望 *ŵ=cw*、*Δŵ=cΔw* 一直成立。因此，对应更新的绝对长度会相差 *c* 倍，更新长度占各自权重长度的比例却相同：

$$
\frac{\lVert\Delta\hat w\rVert}{\lVert\hat w\rVert}
=\frac{c\lVert\Delta w\rVert}{c\lVert w\rVert}
=\frac{\lVert\Delta w\rVert}{\lVert w\rVert}.
$$

这就给了我们一个比较两条更新规则的办法：计算 *‖Δw‖/‖w‖*，看“每步走当前权重长度的多少”。在满足参数缩放协变性的对应更新之间，这个比例保持不变；用它分析普通 SGD，也能看出普通学习率 *η* 与实际相对更新大小之间的关系。

把它记为有效学习率（Effective Learning Rate，ELR）：

$$
\boxed{\eta_{\mathrm{eff}}:=
\frac{\underbrace{\lVert\Delta w\rVert}_{\text{更新长度}}}
{\underbrace{\lVert w\rVert}_{\text{当前权重长度}}}.}
$$

接下来用 ELR 分别计算两条规则的相对更新大小，尝试理解构造结果中 *η* 的含义：

对普通 SGD，*Δw=−ηg*，所以：

$$
\lVert\Delta w\rVert=\eta\lVert g\rVert,
\qquad
\eta_{\mathrm{eff}}=\frac{\eta\lVert g\rVert}{\lVert w\rVert}.
$$

也就是说，设定了 *η*，还要知道当前的 *‖g‖* 和 *‖w‖*，才能知道这一步占权重长度的多少。

再看前面推导出的 *Δw=−η‖w‖g/‖g‖*。先取模长，把实际更新长度算出来：

$$
\begin{aligned}
\lVert\Delta w\rVert
&=\left\lVert-\eta\lVert w\rVert\frac{g}{\lVert g\rVert}\right\rVert\\
&=\eta\lVert w\rVert
\underbrace{\left\lVert\frac{g}{\lVert g\rVert}\right\rVert}_{=1}\\
&=\eta\lVert w\rVert.
\end{aligned}
$$

再代入 ELR 的定义：

$$
\boxed{\eta_{\mathrm{eff}}
=\frac{\eta\lVert w\rVert}{\lVert w\rVert}
=\eta.}
$$

现在就能回答开头的问题了。普通 SGD 中，设定 *η* 后，相对更新大小还会随 *‖g‖/‖w‖* 变化；在我们推导出的 *Δw=−η‖w‖g/‖g‖* 中，更新长度是 *η‖w‖*，所以设定 *η* 就是在设定“每步走当前权重长度的多少”。例如，在后一条规则中设 *η=0.01*，就是让每一步的更新长度等于当前权重长度的 1%。

从这里开始，我们用 *η_eff* 明确表示所构造规则中直接设定的相对步幅，将同一条更新后的规则写成：

$$
\boxed{\Delta w=
-\underbrace{\eta_{\mathrm{eff}}\lVert w\rVert}_{\text{实际走多远}}
\underbrace{\frac{u}{\lVert u\rVert}}_{\text{单位方向}}.}
$$

这也解释了引入 ELR 的用途：它让我们能够比较并直接调节相对更新长度，而不只看乘在梯度或优化器输出前面的学习率数值。

## 回到 A、B：不再分别补偿学习率

现在回到开头的问题。我们得到的更新规则是：

$$
\Delta w=
-\underbrace{\eta\lVert w\rVert}_{\text{更新长度}}
\underbrace{\frac{g}{\lVert g\rVert}}_{\text{单位方向}}.
$$

把它分别用于 A、B，两块共用同一个 *η*。仍取 *η=0.1*，开头四个参数的梯度都为正，因此都向减小参数的方向移动：

|  | **ℓ：A** | **ℓ̂：Â** | **ℓ：B** | **ℓ̂：B̂** |
| --- | --- | --- | --- | --- |
| 当前参数 | 3 | 30 | 4 | 8 |
| 更新长度：η × 当前参数长度 | 0.3 | 3 | 0.4 | 0.8 |
| 更新后的参数 | 2.7 | 27 | 3.6 | 7.2 |
| 映回原参数表示 | 2.7 | 27/10＝2.7 | 3.6 | 7.2/2＝3.6 |

A 块换成十倍大的参数，更新也自然变成十倍；B 块换成两倍大的参数，更新也自然变成两倍。更新规则只使用各块当前的参数长度和梯度方向，不需要额外接收 10 和 2，也不需要分别调整学习率。
前面已经证明，参数与梯度变成 *cw、g/c* 时，这条规则给出的更新也变成原来的 *c* 倍。因此，分别用于 A、B 后，就有：

$$
\Delta\hat A=c_A\Delta A,\qquad
\Delta\hat B=c_B\Delta B.
$$

从对应的初始参数出发，这个关系使更新后的参数继续对应，逐步保持整条训练轨迹一致。

## 从缩放补偿，到直接控制相对步幅

从“同一个模型换一种参数表示，训练能否保持对应”这个问题出发，我们提出参数缩放协变性，再加入损失缩放不变性。从 SGD 出发，在选定的幂函数族中，这两个要求共同选出了相对更新规则。随后计算 ELR，我们从另一个角度理解了更新后规则中学习率系数的含义：控制每步更新长度占当前权重长度的比例。

至此，我们回答了参数表示改变时，怎样让训练保持对应。接下来我们想看：这样的相对更新，对实际训练意味着什么？为什么一些方法还会关注权重方向的变化，甚至进一步固定权重模长？
本文的两个缩放要求与协变性思路参考苏剑林的《从参数对称性到有效学习率》。
<!-- article-source:end -->

<nav class="blog-series" aria-label="相对更新系列">
  <strong>相对更新系列</strong><br>
  <a href="{{ '/blog/2026/invariance-to-relative-updates/' | relative_url }}">blog1 · 从缩放不变性要求推导优化器</a>
  <a href="{{ '/blog/2026/relative-updates-and-hypersphere/' | relative_url }}">blog2 · 相对更新之后：超球面约束额外改变了什么？</a>
</nav>


<section class="blog-feedback" aria-labelledby="feedback-title">
  <h2 id="feedback-title">留言与精选讨论</h2>
  <p>留言通过 <a href="https://formsubmit.co/" rel="noopener noreferrer" target="_blank">FormSubmit</a> 发到我的邮箱，不会自动公开。只有经你同意并由我精选的留言及回复，才会展示在这里；邮箱不会公开。</p>
  {% assign selected_comments = site.data.blog_comments[page.comment_key] %}
  {% if selected_comments.size > 0 %}
    <h3>精选讨论</h3>
    {% for comment in selected_comments %}
      <div class="blog-selected-comment">
        <p><strong>{{ comment.author | escape }}</strong>{% if comment.date %} · <time>{{ comment.date | escape }}</time>{% endif %}</p>
        <p>{{ comment.message | escape | newline_to_br }}</p>
        {% if comment.reply and comment.reply != '' %}
          <div class="author-reply">
            <p><strong>{{ site.first_name | escape }} {{ site.last_name | escape }} 回复</strong>{% if comment.reply_date %} · <time>{{ comment.reply_date | escape }}</time>{% endif %}</p>
            <p>{{ comment.reply | escape | newline_to_br }}</p>
          </div>
        {% endif %}
      </div>
    {% endfor %}
  {% else %}
    <p class="feedback-note">暂时还没有公开的精选留言。</p>
  {% endif %}
  <form action="https://formsubmit.co/{{ site.data.socials.email | escape }}" method="POST" accept-charset="UTF-8">
    <input type="hidden" name="_subject" value="[博客留言] {{ page.title | escape }}">
    <input type="hidden" name="_next" value="{{ '/blog/message-received/' | absolute_url }}">
    <input type="hidden" name="_template" value="table">
    <input type="hidden" name="article" value="{{ page.title | escape }}">
    <input type="hidden" name="article_url" value="{{ page.url | absolute_url }}">
    <input type="text" name="_honey" style="display: none" tabindex="-1" autocomplete="off" aria-hidden="true">
    <label for="feedback-name">姓名或昵称
      <input id="feedback-name" name="name" type="text" autocomplete="nickname" maxlength="80" required>
    </label>
    <label for="feedback-email">邮箱（可选，用于私下回复，不会公开）
      <input id="feedback-email" name="email" type="email" autocomplete="email" maxlength="254">
    </label>
    <label for="feedback-message">留言
      <textarea id="feedback-message" name="message" maxlength="10000" required></textarea>
    </label>
    <label class="consent" for="feedback-consent">
      <input id="feedback-consent" name="permission_to_publish" type="checkbox" value="yes">
      <span>我同意作者将这条留言与所用昵称精选公开。不勾选则仅作私下交流。</span>
    </label>
    <button type="submit">发送私密留言</button>
  </form>
</section>
