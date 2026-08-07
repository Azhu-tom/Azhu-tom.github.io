import React from 'react'
import { categories } from '../../data/modelData'
import './CategoryFilter.css'

function CategoryFilter({ selected, onChange }) {
  return (
    <div className="engineering-category-filter">
      <div className="filter-header">
        <span className="filter-title">📂 分类筛选</span>
        <span className="filter-count">
          {categories.find(c => c.id === selected)?.count || 0} 项
        </span>
      </div>

      <div className="category-tags">
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-tag ${selected === category.id ? 'active' : ''}`}
            onClick={() => onChange(category.id)}
            title={`${category.name} - ${category.count}个模型`}
          >
            <span className="tag-icon">{category.icon}</span>
            <span className="tag-name">{category.name}</span>
            {selected === category.id && (
              <span className="tag-count">{category.count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default CategoryFilter
