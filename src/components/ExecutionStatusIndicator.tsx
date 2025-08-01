'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Square, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Loader2,
  Zap,
  AlertTriangle,
  XCircle
} from 'lucide-react';

export type ExecutionStatus = 
  | 'idle' 
  | 'queued' 
  | 'running' 
  | 'completed' 
  | 'error' 
  | 'timeout' 
  | 'cancelled'
  | 'retrying';

export interface ExecutionStatusProps {
  status: ExecutionStatus;
  progress?: number;
  executionTime?: number;
  queuePosition?: number;
  canCancel?: boolean;
  canRetry?: boolean;
  retryCount?: number;
  maxRetries?: number;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const ExecutionStatusIndicator: React.FC<ExecutionStatusProps> = ({
  status,
  progress = 0,
  executionTime = 0,
  queuePosition,
  canCancel = false,
  canRetry = false,
  retryCount = 0,
  maxRetries = 3,
  onCancel,
  onRetry,
  className = ''
}) => {
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'idle':
        return {
          icon: Play,
          label: 'Ready to run',
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          variant: 'secondary' as const
        };
      case 'queued':
        return {
          icon: Clock,
          label: queuePosition ? `Queued (position ${queuePosition})` : 'Queued',
          color: 'text-blue-500',
          bgColor: 'bg-blue-100',
          variant: 'secondary' as const
        };
      case 'running':
        return {
          icon: Loader2,
          label: 'Running',
          color: 'text-blue-500',
          bgColor: 'bg-blue-100',
          variant: 'default' as const,
          animate: true
        };
      case 'completed':
        return {
          icon: CheckCircle,
          label: 'Completed',
          color: 'text-green-500',
          bgColor: 'bg-green-100',
          variant: 'default' as const
        };
      case 'error':
        return {
          icon: XCircle,
          label: 'Error',
          color: 'text-red-500',
          bgColor: 'bg-red-100',
          variant: 'destructive' as const
        };
      case 'timeout':
        return {
          icon: AlertTriangle,
          label: 'Timeout',
          color: 'text-orange-500',
          bgColor: 'bg-orange-100',
          variant: 'destructive' as const
        };
      case 'cancelled':
        return {
          icon: Square,
          label: 'Cancelled',
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          variant: 'secondary' as const
        };
      case 'retrying':
        return {
          icon: RotateCcw,
          label: `Retrying (${retryCount}/${maxRetries})`,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100',
          variant: 'secondary' as const,
          animate: true
        };
      default:
        return {
          icon: AlertCircle,
          label: 'Unknown',
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          variant: 'secondary' as const
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Status Badge */}
      <Badge variant={config.variant} className="flex items-center gap-1.5 px-2 py-1">
        <Icon 
          className={`w-3 h-3 ${config.color} ${config.animate ? 'animate-spin' : ''}`} 
        />
        <span className="text-xs font-medium">{config.label}</span>
      </Badge>

      {/* Execution Time */}
      {executionTime > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {formatTime(executionTime)}
        </div>
      )}

      {/* Progress Bar for Running Status */}
      {status === 'running' && progress > 0 && (
        <div className="flex-1 min-w-0 max-w-32">
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        {canCancel && status === 'running' && onCancel && (
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            className="h-6 px-2 text-xs"
          >
            <Square className="w-3 h-3 mr-1" />
            Cancel
          </Button>
        )}

        {canRetry && (status === 'error' || status === 'timeout') && onRetry && retryCount < maxRetries && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="h-6 px-2 text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
};

// Enhanced status indicator with detailed information
export interface DetailedExecutionStatusProps extends ExecutionStatusProps {
  language?: string;
  memoryUsage?: number;
  cpuUsage?: number;
  showDetails?: boolean;
}

export const DetailedExecutionStatus: React.FC<DetailedExecutionStatusProps> = ({
  language,
  memoryUsage,
  cpuUsage,
  showDetails = false,
  ...statusProps
}) => {
  const formatMemory = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${mb.toFixed(1)}MB`;
  };

  return (
    <div className="space-y-2">
      <ExecutionStatusIndicator {...statusProps} />
      
      {showDetails && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {language && (
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>{language}</span>
            </div>
          )}
          
          {memoryUsage && (
            <div className="flex items-center gap-1">
              <span>Memory: {formatMemory(memoryUsage)}</span>
            </div>
          )}
          
          {cpuUsage && (
            <div className="flex items-center gap-1">
              <span>CPU: {cpuUsage.toFixed(1)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};