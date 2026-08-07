import React, { useState } from 'react'
import './SearchBar.css'

function SearchBar({ onSearch, placeholder = '搜索物料编码、名称、规格...', value, onChange }) {
  const [localValue, setLocalValue] = useState(value || '')

  const handleChange = (e) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    if (onChange) {
      onChange(newValue)
    }
    if (onSearch) {
      onSearch(newValue)
    }
  }

  const handleClear = () => {
    setLocalValue('')
    if (onChange) onChange('')
    if (onSearch) onSearch('')
  }

  return (
    <div className="engineering-search-bar">
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
        />
        {localValue && (
          <button className="clear-btn" onClick={handleClear} title="清除搜索">
            ✕
          </button>
        )}
      </div>
      {onSearch && (
        <div className="search-hint">
          <span>💡 支持搜索：物料编码 | 名称 | 规格 | 材质</span>
        </div>
      )}
    </div>
  )
}

export default SearchBar
