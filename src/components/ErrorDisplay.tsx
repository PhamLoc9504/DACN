'use client';

import { AlertTriangle, X, RefreshCw, Info } from 'lucide-react';
import { ErrorDisplay as ErrorDisplayType } from '@/lib/errorHandler';
import Button from './Button';

interface ErrorDisplayProps {
  error: ErrorDisplayType;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorDisplay({
  error,
  onDismiss,
  onRetry,
  className = '',
}: ErrorDisplayProps) {
  const getIcon = () => {
    switch (error.severity) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }
  };

  const getBgColor = () => {
    switch (error.severity) {
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-red-50 border-red-200';
    }
  };

  const getTextColor = () => {
    switch (error.severity) {
      case 'warning':
        return 'text-amber-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-red-800';
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 ${getBgColor()} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold mb-1 ${getTextColor()}`}>
            {error.title}
          </h3>
          <p className={`text-sm ${getTextColor()} opacity-90`}>
            {error.message}
          </p>
          {(error.canRetry && onRetry) || onDismiss ? (
            <div className="flex items-center gap-2 mt-3">
              {error.canRetry && onRetry && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onRetry}
                  className="flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Thử lại
                </Button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className={`text-sm ${getTextColor()} opacity-70 hover:opacity-100 transition-opacity`}
                  aria-label="Đóng thông báo"
                >
                  Đóng
                </button>
              )}
            </div>
          ) : null}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 ${getTextColor()} opacity-50 hover:opacity-100 transition-opacity`}
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

