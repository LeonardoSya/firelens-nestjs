import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# 读取CSV文件
df = pd.read_csv('src/temp/data/firms_data_2024-11-02T11:05:09.897Z_ndvi.csv')

# 1. 详细的描述性统计
print("NDVI详细统计分析:")
stats = df['ndvi'].describe(percentiles=[.05, .25, .5, .75, .95])
print(stats)

# 2. 创建多个可视化图表
fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 12))

# 2.1 直方图
ax1.hist(df['ndvi'], bins=50, density=True, alpha=0.7)
ax1.set_title('NDVI分布直方图')
ax1.set_xlabel('NDVI值')
ax1.set_ylabel('频率')
ax1.grid(True)

# 2.2 箱型图
df.boxplot(column='ndvi', ax=ax2)
ax2.set_title('NDVI箱型图')
ax2.set_ylabel('NDVI值')
ax2.grid(True)

# 2.3 散点图（按索引排序的NDVI值）
ax3.scatter(range(len(df)), sorted(df['ndvi']), alpha=0.5, s=1)
ax3.set_title('NDVI值分布散点图')
ax3.set_xlabel('样本序号')
ax3.set_ylabel('NDVI值')
ax3.grid(True)

# 2.4 累积分布图
sorted_data = sorted(df['ndvi'])
cumulative = np.arange(1, len(sorted_data) + 1) / len(sorted_data)
ax4.plot(sorted_data, cumulative)
ax4.set_title('NDVI累积分布图')
ax4.set_xlabel('NDVI值')
ax4.set_ylabel('累积概率')
ax4.grid(True)

plt.tight_layout()
plt.show()

# 3. 详细的统计分析
print("\n详细分析结果:")
print(f"样本总数: {len(df)}")
print(f"缺失值数量: {df['ndvi'].isnull().sum()}")
print(f"唯一值数量: {df['ndvi'].nunique()}")

# 计算各区间的分布
bins = [-1, -0.5, 0, 0.2, 0.4, 0.6, 0.8, 1]
labels = ['极低 (<-0.5)', '很低 (-0.5-0)', '低 (0-0.2)', 
          '中等 (0.2-0.4)', '良好 (0.4-0.6)', 
          '很好 (0.6-0.8)', '极好 (>0.8)']
df['ndvi_category'] = pd.cut(df['ndvi'], bins=bins, labels=labels)

print("\nNDVI值分布情况:")
distribution = df['ndvi_category'].value_counts().sort_index()
for category, count in distribution.items():
    percentage = (count / len(df)) * 100
    print(f"{category}: {count} 个样本 ({percentage:.2f}%)")

# 4. 异常值分析
Q1 = df['ndvi'].quantile(0.25)
Q3 = df['ndvi'].quantile(0.75)
IQR = Q3 - Q1
lower_bound = Q1 - 1.5 * IQR
upper_bound = Q3 + 1.5 * IQR

print("\n异常值分析:")
print(f"下界: {lower_bound:.3f}")
print(f"上界: {upper_bound:.3f}")
print(f"异常值数量: {len(df[(df['ndvi'] < lower_bound) | (df['ndvi'] > upper_bound)])}")

# 5. 基本统计指标
print("\n集中趋势和离散程度:")
print(f"众数: {df['ndvi'].mode().values[0]:.3f}")
print(f"偏度: {df['ndvi'].skew():.3f}")
print(f"峰度: {df['ndvi'].kurtosis():.3f}")

# 6. 绘制区间分布柱状图
plt.figure(figsize=(12, 6))
distribution.plot(kind='bar')
plt.title('NDVI值区间分布')
plt.xlabel('NDVI区间')
plt.ylabel('样本数量')
plt.xticks(rotation=45)
plt.grid(True)
plt.tight_layout()
plt.show()