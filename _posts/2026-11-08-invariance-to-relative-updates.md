---
layout: "research"
title: "从缩放不变性要求推导优化器"
date: "2026-11-08 12:00:00 +0800"
description: "从参数缩放协变性与损失缩放不变性出发，构造相对更新，并理解 ELR 与学习率系数的关系。"
lang: "zh-CN"
permalink: "/blog/2026/invariance-to-relative-updates/"
tags: ["optimization", "elr"]
categories: ["research-notes"]
related_posts: false
giscus_comments: false
disqus_comments: false
toc: true
series: "relative-updates"
series_order: 1
reading_minutes: 9
---

<!-- article-source:start -->
同一个函数可以有两种参数化写法：一种直接用参数 $$w$$，另一种存 $$\hat w  = cw$$，并在前向中除回 $$c$$。只要参数对应，它们就 functionally equivalent：

$$
\hat\ell(\hat w)=\ell\!\left(\underbrace{\hat w/c}_{\text{换回参数 }w}\right).
$$

这像用米和厘米记同一段长度，例如 $$\ell (w)=w^{2}$$、$$c=10$$ 时，$$\hat\ell (\hat w )=\hat w ^{2}/100$$。比较 $$\ell (3)=9$$ 与 $$\hat\ell (3)=0.09$$，结果不同，**因为 $$w=3$$ 与 $$\hat w =3$$ 不是对应参数**。若 $$w=3$$，对应的是 $$\hat w =cw=30$$，因此应该比较 $$\ell (3)=9=\hat\ell (30)$$。一般地，恒有 $$\hat\ell (cw)=\ell (w)$$。模型前向也按同样方式改写，所以在 $$\hat w =cw$$ 下，对任意模型输入 $$x$$ 的预测相同。

## 参数换一种表示，SGD 的更新就变了

用 SGD，取 $$c=10$$，两边同样设学习率 $$\eta$$：训练 $$\ell (w)$$ 时，$$w$$ 每步走 $$\eta$$ 倍梯度；训练 $$\hat\ell (\hat w )=\ell (\hat w /10)$$ 时，映回 $$w$$ 却只走原来的百分之一。模型没变，映回原坐标后的一步位移只有原来的百分之一。

现在用同一个学习率 $$\eta$$ 各走一步。在 $$\hat\ell (\hat w )=\ell (\hat w /c)$$ 下，$$w$$ 的变化会被缩小两次：

1. 梯度小了 c 倍：单位变小后，参数每变化 1，对损失的影响也变小，所以 $$\nabla \hat\ell (\hat w )=g/c$$。
2. 换算回去又小了 c 倍：在 $$\hat w$$ 上走的距离，要除以 $$c$$ 才是 $$w$$ 上走的距离。

所以：

$$
\hat w_{t+1}=\hat w_t-\eta\,g_t/c
\quad\Rightarrow\quad
w_{t+1}=w_t-c^{-2}\eta g_t.
$$

也就是说，换成 $$\hat\ell$$ 后，SGD 的实际学习率变成原来的 $$c^{-2}$$ 倍，如果想要训练轨迹一致，还要把新的学习率放大回去。

## 各块缩放不同，学习率就要分别补偿

现在把刚才的单块结论分别用于两个参数块。 $$c_A=10$$， $$c_B=2$$。损失是 $$\ell =A^{2}+B^{2}$$，当前 $$A=3$$、$$B=4$$。A 块存成 $$\hat A =10A=30$$，B 块存成 $$\hat B =2B=8$$。

$$
\hat\ell(\hat A,\hat B)=(\hat A/10)^2+(\hat B/2)^2.
$$

对 $$\ell (A,B)$$ 和 $$\hat\ell (\hat A ,\hat B )$$ 分别求梯度：

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

SGD 的公式： $$w \leftarrow  w-\eta g$$，例如 $$\eta =10^{-1}$$：

$$
\hat A\leftarrow30-(100\eta)\cdot0.6=24,\qquad A=24/10=2.4,
$$

$$
\hat B\leftarrow8-(4\eta)\cdot4=6.4,\qquad B=6.4/2=3.2.
$$

要让 $$\ell$$ 与 $$\hat\ell$$ 的 SGD 轨迹对应，A 块的学习率需要乘 $$c_A^{2}=100$$，B 块需要乘 $$c_B^{2}=4$$。换一种参数表示，就要分别补偿各块的学习率。

能不能把这种补偿交给优化器自己完成？我们希望对 A、B 使用同一个学习率，由优化器根据各块当前的参数和梯度计算更新，不必再额外告诉它 $$c_A,\,c_B$$ 是多少。这样，从 $$\hat A _{0}=c_A A_{0},\,\hat B _{0}=c_B B_{0}$$ 出发，每一步更新后仍然保持：

$$
\hat A_t=c_A A_t,\qquad \hat B_t=c_B B_t.
$$

也就是说，两种参数表示下的数值可以不同，但把 $$\hat A ,\,\hat B$$ 分别除回各自的缩放倍数后，得到的参数轨迹始终一致。下面先对一个参数块推导需要怎样的更新规则，再将它分别用于 A、B。

## 让更新保持对应：参数缩放协变性

不管用什么优化器，一步更新都可以写成 $$w \leftarrow  w-\phi$$，其中 $$\phi$$ 是实际更新量。不考虑权重衰减时，常见优化器可写成 $$\phi =\eta u$$，比如 SGD 的 $$u$$ 是梯度 $$g$$，Adam 的 $$u$$ 是 $$m/\sqrt{v}$$。

要让轨迹一致，φ 该满足什么？我们从一步更新来看。新写法在前向时用的是 ŵ/c，所以两种写法要表示同一个函数，每一步都必须满足 ŵt = c wt。第 0 步时默认成立，假设第 t 步这个关系成立，两种写法的更新分别是：

$$
w_{t+1}=w_t-\phi,\qquad \hat w_{t+1}=\hat w_t-\hat\phi.
$$

第 $$t+1$$ 步继续满足 $$\hat w _{t+1}=cw_{t+1}$$ 当且仅当：

$$
\hat w_t-\hat\phi=c(w_t-\phi)=\hat w_t-c\phi
\quad\Rightarrow\quad
\boxed{\hat\phi=c\phi.}
$$

也就是说，**ℓ̂ 的更新量必须是 ℓ 的 c 倍，即 φ̂=cφ。**反过来，从 $$\hat w _{0}=cw_{0}$$ 出发，只要每一步满足 $$\hat\phi =c\phi$$，就能一直保持 $$\hat w _{t}=cw_{t}$$。

优化器是输入当前参数和梯度、输出更新量的函数，记作 $$\phi (w,g)$$，其中 $$g=\nabla \ell (w)$$。对 $$\hat\ell (\hat w )=\ell (\hat w /c)$$，链式法则给出：

$$
z_j=\hat w_j/c,\qquad \hat\ell(\hat w)=\ell(z_1,\ldots,z_n).
$$

先固定一个 $$i$$，看 $$\hat w _{i}$$ 变化时，会通过哪些 $$z_{j}$$ 影响损失。

$$
\frac{\partial\hat\ell}{\partial\hat w_i}
=\sum_{j=1}^n
\underbrace{\frac{\partial\ell}{\partial z_j}}_{\text{损失对 }z_j\text{ 的变化率}}
\underbrace{\frac{\partial z_j}{\partial\hat w_i}}_{\hat w_i\text{ 对 }z_j\text{ 的影响}}.
$$

因为 $$c$$ 是固定常数，而且 $$z_{j}=\hat w _{j}/c$$，所以对 $$\hat w _{i}$$ 求偏导时：

$$
\frac{\partial z_j}{\partial\hat w_i}
=\frac1c\frac{\partial\hat w_j}{\partial\hat w_i}
=\begin{cases}
1/c,&j=i,\\
0,&j\ne i.
\end{cases}
$$

（例外：需要检查重新参数化的具体形式，若改成 $$z_{1}=\hat w _{1}+\hat w _{2}$$，那么改变 $$\hat w _{2}$$ 也会影响 $$z_{1}$$，也就是权重之间的相对大小 matters）

把求和中 $$j=i$$ 的那一项单独拿出来：

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

每个 $$z_{j}$$ 只依赖对应的 $$\hat w _{j}$$，所以只有 $$j=i$$ 的一项不为零。上式对每个 $$i$$ 都成立，故：

$$
\nabla_{\hat w}\hat\ell(\hat w)=g/c.
$$

于是 $$\hat\phi =\phi (cw,g/c)$$。代入 $$\hat\phi =c\phi$$，就得到参数缩放协变性对优化器提出的要求：

$$
\boxed{\phi(cw,g/c)=c\phi(w,g).}
$$

### 保留梯度方向，构造幂函数族

我们先从熟悉的 SGD 出发。它的更新量是：

$$
\phi(w,g)=\eta g.
$$

由 $$\ell$$ 改用 $$\hat\ell$$，即 $$(w,g)\to (cw,g/c)$$ 时，SGD 的更新量变成 $$\eta g/c$$，而参数缩放协变性要求它变成 $$c\eta g$$。那我们能不能先保留梯度给出的方向，只给更新量补上一个尺度系数？写成：

$$
\phi(w,g)=\underbrace{\eta\,s(w,g)}_{\text{标量系数}}\,\underbrace{g}_{\text{梯度向量}}.
$$

这里用标量 $$s(w,g)$$ 乘梯度向量，使得更新量与当前梯度共线。若 $$s>0$$，实际参数变化 $$-\phi$$ 就沿负梯度方向。

把它代入参数缩放协变性的条件（先考虑 $$w,g\ne 0$$）：

$$
\eta\,s(cw,g/c)\,g/c=c\eta\,s(w,g)\,g
\quad\Rightarrow\quad
s(cw,g/c)=c^2s(w,g).
$$

所以，我们要找的系数需要从当前参数和梯度补上 $$c^{2}$$ 这个倍数。

我们研究的正是参数尺度变化，因此一个自然的起点是：先只用权重和梯度的模长来算这个系数：

$$
s(w,g)=S(\lVert w\rVert,\lVert g\rVert).
$$

我们暂时不用权重和梯度的方向信息，比如它们之间的夹角。这样就把向量问题变成了两个正数的问题。

接着，为了方便求解，先尝试幂函数形式。因为模长乘上一个常数后，幂函数的变化可以直接用指数算出来：

$$
S(r,q)=r^a q^b.
$$

于是得到我们的**构造假设**：更新与当前梯度共线，并且更新的缩放只通过 $$\lVert w\rVert$$、$$\lVert g\rVert$$ 的幂次进入。写成：

$$
\phi(w,g)=\eta\lVert w\rVert^a\lVert g\rVert^b g.
$$

将 $$\ell \to \hat\ell$$ 对应的 $$(w,g)\to (cw,g/c)$$ 代入：

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

而参数缩放协变性要求它等于 $$c\phi (w,g)$$，所以：

$$
a-b-1=1\qquad\Longleftrightarrow\qquad a-b=2.
$$

一个方程有一族解。令 $$b=p-1$$，那么 $$a=p+1$$，得到：

$$
\boxed{\phi_p(w,g)=\eta\lVert w\rVert^{p+1}\lVert g\rVert^{p-1}g,\qquad p\in\mathbb R.}
$$

所以，在这个“梯度共线 + 幂次缩放”的构造族中，**任意 $$p$$ 都满足参数缩放协变性**。

## 损失整体缩放，更新能否保持不变？

到这里，我们已经找到一族能处理 $$\ell \to \hat\ell$$ 的更新规则，但 $$p$$ 还没有确定。再看另一种变化：将 $$\ell (w)$$ 换成 $$\bar\ell (w)=k\ell (w)$$，其中 $$k>0$$。参数、预测和数据不变，只改变损失的整体倍数。

比如，同一批有 $$N$$ 个样本，每个样本的损失是 $$\ell _{j}(w)$$。我们可以把它们求平均，也可以直接求和：

$$
\ell_{\mathrm{mean}}(w)=\frac1N\sum_{j=1}^N\ell_j(w),\qquad
\ell_{\mathrm{sum}}(w)=\sum_{j=1}^N\ell_j(w)=N\ell_{\mathrm{mean}}(w).
$$

因为 $$\ell _{\mathrm{sum}}=N\ell _{\mathrm{mean}}$$、$$N>0$$，让两个损失达到最低的 $$w$$ 相同：

$$
\arg\min_w\ell_{\mathrm{sum}}(w)=\arg\min_w\ell_{\mathrm{mean}}(w).
$$

但梯度也满足 $$\nabla \ell _{\mathrm{sum}}=N\nabla \ell _{\mathrm{mean}}$$。普通 SGD 用同一个学习率更新时，$$\ell _{\mathrm{sum}}$$ 下的更新长度是 $$\ell _{\mathrm{mean}}$$ 下的 $$N$$ 倍。和第一个要求类似，若想恢复相同更新，需要把 $$\ell _{\mathrm{sum}}$$ 的学习率除以 $$N$$。

前面比较 $$\ell (w)$$ 与 $$\hat\ell (\hat w )$$，这里比较 $$\ell _{\mathrm{mean}}(w)$$ 与 $$\ell _{\mathrm{sum}}(w)$$。**我们希望同一套超参数也能处理后一种变化，不必仅仅因为从平均改成求和，就重新补偿学习率。**

一般地，把整个损失乘正常数 $$k>0$$，记作 $$\bar\ell (w)=k\ell (w)$$，参数 $$w$$ 不变，梯度变成 $$kg$$。为了让这次更新轨迹与原来完全一样，我们提出第二个要求——损失缩放不变性：

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

现在回到刚才还没确定的 $$p$$。把损失缩放后的梯度代入幂函数族：

$$
\phi_p(w,kg)=\eta\lVert w\rVert^{p+1}\lVert kg\rVert^{p-1}(kg)=k^p\phi_p(w,g).
$$

若要对任意 $$k>0$$ 满足损失缩放不变性，且更新不恒为零，必须有 $$k^p=1$$，所以：

$$
\boxed{p=0,\qquad \phi_0(w,g)=\eta\lVert w\rVert\frac{g}{\lVert g\rVert}.}
$$

$$p=0$$ 是**刚才这个幂函数族中**同时满足两个缩放要求的唯一非零选择，但不是所有优化器中的唯一解。

损失缩放不变性针对的是整个损失的统一倍数，但不是所有类型的缩放都应该保持不变性。

（例如 $$\ell =\ell _{1}+\lambda \ell _{2}$$ 中，只改变 $$\lambda$$ 会改变两个目标的相对重要性，优化器可以忽略整个损失的计分倍数，但不应因此忽略不同训练目标之间的权重变化。）

从两个要求本身看，利用损失缩放不变性，可以在参数缩放协变性的条件中消去梯度的 $$1/c$$：

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

变化的方向，由梯度的单位方向 $$g/\lVert g\rVert$$ 决定；走多远，由 $$\eta \lVert w\rVert$$ 决定。方向和长度可以分别处理。

那么，方向一定要来自原始梯度吗？前面我们把常见优化器的更新写成 $$\phi =\eta u$$：SGD 的 $$u$$ 是 $$g$$，Adam 则会用历史梯度构造 $$u$$。沿着刚才的思路，可以继续让优化器决定往哪里走，再用同一个规则决定走多远：

$$
\boxed{\phi=
\underbrace{\eta\lVert w\rVert}_{\text{更新长度}}
\underbrace{\frac{u}{\lVert u\rVert}}_{\text{单位方向}}.}
$$

把 $$g/\lVert g\rVert$$ 换成 $$u/\lVert u\rVert$$，就是让优化器给出往哪里走；前面的 $$\eta \lVert w\rVert$$ 决定走多远。

检查 $$\ell \to \hat\ell$$ 时，先看长度：$$\eta \lVert \hat w \rVert =\eta \lVert cw\rVert =c\eta \lVert w\rVert$$，满足放大 $$c$$ 倍的要求。再看方向：训练 $$\ell$$ 与 $$\hat\ell$$ 时，优化器分别输出 $$u$$ 与 $$\hat u$$，需要满足：

$$
\frac{\hat u}{\lVert\hat u\rVert}=\frac{u}{\lVert u\rVert},
$$

涉及历史状态时，也要把状态的变换一起算进去。

方向满足这个关系，就有：

$$
\hat\phi=\eta\lVert cw\rVert\frac{\hat u}{\lVert\hat u\rVert}
=c\eta\lVert w\rVert\frac{u}{\lVert u\rVert}=c\phi.
$$

具体做法是：先让优化器照常算出 $$u$$，再除以 $$\lVert u\rVert$$，只取它指向哪里；最后乘上 $$\eta \lVert w\rVert$$，决定这一步走多远。也就是把原先的 $$\eta u$$ 换成 $$\eta \lVert w\rVert u/\lVert u\rVert$$。

再检查 $$\ell \to \bar\ell =k\ell$$。参数 $$w$$ 不变，设优化器输出由 $$u$$ 变成 $$u_k$$，两次更新为：

$$
\phi=\eta\lVert w\rVert\frac{u}{\lVert u\rVert},\qquad
\phi_k=\eta\lVert w\rVert\frac{u_k}{\lVert u_k\rVert}.
$$

因为 $$w$$ 没有变，两边的更新长度都已经是 $$\eta \lVert w\rVert$$。要让更新向量也完全相同，剩下的要求就是方向相同：

$$
\frac{u_k}{\lVert u_k\rVert}=\frac{u}{\lVert u\rVert}
\quad\Rightarrow\quad
\phi_k=\phi.
$$

例如 SGD 给出 $$u=g$$，损失乘 $$k$$ 后给出 $$u_k=kg$$。由于 $$k>0$$，归一化会消去这个倍数：

$$
\frac{u_k}{\lVert u_k\rVert}=\frac{kg}{k\lVert g\rVert}=\frac{g}{\lVert g\rVert}.
$$

因此，用 SGD 方向构造的规则同时满足参数缩放协变性和损失缩放不变性。

换用其他优化器时，分别检查 $$\ell \to \hat\ell$$ 和 $$\ell \to \bar\ell =k\ell$$：前者要求 $$\hat u /\lVert \hat u \rVert =u/\lVert u\rVert$$，后者要求 $$u_k/\lVert u_k\rVert =u/\lVert u\rVert$$。归一化可以消去 $$u$$ 的正数倍长度变化。

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

普通 SGD 中，学习率 ***η*** 乘在梯度 $$g$$ 上；满足不变性要求的构造中，学习率 ***η*** 与 $$\lVert w\rVert$$ 相乘，再乘单位方向 $$g/\lVert g\rVert$$。

现在我们想知道：**更新公式改变后，我们设定的 $$\eta$$ 究竟在控制什么？** 为此，需要根据两条公式各自算出的实际位移 $$\Delta w$$，比较它们每步走多远。

发现：训练 $$\ell$$ 与 $$\hat\ell$$ 时，我们希望 $$\hat w =cw$$、$$\Delta \hat w =c\Delta w$$ 一直成立。因此，对应更新的绝对长度会相差 $$c$$ 倍，更新长度占各自权重长度的比例却相同：

$$
\frac{\lVert\Delta\hat w\rVert}{\lVert\hat w\rVert}
=\frac{c\lVert\Delta w\rVert}{c\lVert w\rVert}
=\frac{\lVert\Delta w\rVert}{\lVert w\rVert}.
$$

这就给了我们一个比较两条更新规则的办法：计算 $$\lVert \Delta w\rVert /\lVert w\rVert$$，看“每步走当前权重长度的多少”。在满足参数缩放协变性的对应更新之间，这个比例保持不变；用它分析普通 SGD，也能看出普通学习率 $$\eta$$ 与实际相对更新大小之间的关系。

把它记为有效学习率（Effective Learning Rate，ELR）：

$$
\boxed{\eta_{\mathrm{eff}}:=
\frac{\underbrace{\lVert\Delta w\rVert}_{\text{更新长度}}}
{\underbrace{\lVert w\rVert}_{\text{当前权重长度}}}.}
$$

接下来用 ELR 分别计算两条规则的相对更新大小，尝试理解构造结果中 $$\eta$$ 的含义：

对普通 SGD，$$\Delta w=-\eta g$$，所以：

$$
\lVert\Delta w\rVert=\eta\lVert g\rVert,
\qquad
\eta_{\mathrm{eff}}=\frac{\eta\lVert g\rVert}{\lVert w\rVert}.
$$

也就是说，设定了 $$\eta$$，还要知道当前的 $$\lVert g\rVert$$ 和 $$\lVert w\rVert$$，才能知道这一步占权重长度的多少。

再看前面推导出的 $$\Delta w=-\eta \lVert w\rVert g/\lVert g\rVert$$。先取模长，把实际更新长度算出来：

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

现在就能回答开头的问题了。普通 SGD 中，设定 $$\eta$$ 后，相对更新大小还会随 $$\lVert g\rVert /\lVert w\rVert$$ 变化；在我们推导出的 $$\Delta w=-\eta \lVert w\rVert g/\lVert g\rVert$$ 中，更新长度是 $$\eta \lVert w\rVert$$，所以设定 $$\eta$$ 就是在设定“每步走当前权重长度的多少”。例如，在后一条规则中设 $$\eta =0.01$$，就是让每一步的更新长度等于当前权重长度的 1%。

从这里开始，我们用 $$\eta _{\mathrm{eff}}$$ 明确表示所构造规则中直接设定的相对步幅，将同一条更新后的规则写成：

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

把它分别用于 A、B，两块共用同一个 $$\eta$$。仍取 $$\eta =0.1$$，开头四个参数的梯度都为正，因此都向减小参数的方向移动：

|  | **ℓ：A** | **ℓ̂：Â** | **ℓ：B** | **ℓ̂：B̂** |
| --- | --- | --- | --- | --- |
| 当前参数 | 3 | 30 | 4 | 8 |
| 更新长度：η × 当前参数长度 | 0.3 | 3 | 0.4 | 0.8 |
| 更新后的参数 | 2.7 | 27 | 3.6 | 7.2 |
| 映回原参数表示 | 2.7 | 27/10＝2.7 | 3.6 | 7.2/2＝3.6 |

A 块换成十倍大的参数，更新也自然变成十倍；B 块换成两倍大的参数，更新也自然变成两倍。更新规则只使用各块当前的参数长度和梯度方向，不需要额外接收 10 和 2，也不需要分别调整学习率。

前面已经证明，参数与梯度变成 $$cw,\,g/c$$ 时，这条规则给出的更新也变成原来的 $$c$$ 倍。因此，分别用于 A、B 后，就有：

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
