import React from 'react';

/**
 * ErrorBoundary - React错误边界组件
 * 捕获子组件的渲染错误，防止白屏
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ ErrorBoundary捕获到错误:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // 自定义错误UI
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#1a1f35',
          borderRadius: '12px',
          margin: '20px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ color: '#fff', marginBottom: '12px' }}>组件加载出错</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6 }}>
            {this.state.error && this.state.error.toString()}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #00d4ff, #09c)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            🔄 刷新页面
          </button>

          {/* 开发模式下显示详细错误信息 */}
          {process.env.NODE_ENV === 'development' && (
            <details style={{
              marginTop: '24px',
              textAlign: 'left',
              backgroundColor: '#0d1117',
              padding: '16px',
              borderRadius: '8px',
              color: '#f85149',
              fontSize: '12px',
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              <summary>📋 详细错误信息（仅开发模式）</summary>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {this.state.error && this.state.error.toString()}
                {'\n\n'}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
