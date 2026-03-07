import React from 'react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * React Error Boundary — catches rendering crashes and shows a recovery UI
 * instead of a blank white screen. Required for production iOS apps.
 * 
 * Apple reviewers WILL test edge cases. A crash = rejection.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ErrorBoundary] Caught:', error, errorInfo);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(to bottom, #0a0612, #1a0e2e)',
                        color: '#e0d6f0',
                        padding: '24px',
                        textAlign: 'center',
                        fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                >
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌑</div>
                    <h1 style={{
                        fontFamily: 'Cinzel, serif',
                        fontSize: '20px',
                        color: '#FFD700',
                        letterSpacing: '3px',
                        marginBottom: '8px',
                    }}>
                        A COSMIC DISTURBANCE
                    </h1>
                    <p style={{
                        fontSize: '13px',
                        color: '#a89cc8',
                        maxWidth: '300px',
                        lineHeight: '1.6',
                        marginBottom: '24px',
                    }}>
                        The stars have momentarily lost alignment. Please try again.
                    </p>
                    <button
                        onClick={this.handleReload}
                        style={{
                            background: 'rgba(255, 215, 0, 0.15)',
                            color: '#FFD700',
                            border: '1px solid rgba(255, 215, 0, 0.25)',
                            borderRadius: '12px',
                            padding: '12px 32px',
                            fontSize: '14px',
                            fontFamily: 'Cinzel, serif',
                            fontWeight: 600,
                            letterSpacing: '2px',
                            cursor: 'pointer',
                        }}
                    >
                        ✦ REALIGN ✦
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
