// Bundle analysis and optimization utilities

interface BundleStats {
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkInfo[];
  dependencies: DependencyInfo[];
  duplicates: DuplicateInfo[];
  unusedExports: UnusedExportInfo[];
}

interface ChunkInfo {
  name: string;
  size: number;
  gzippedSize: number;
  modules: string[];
  isAsync: boolean;
  parents: string[];
  children: string[];
}

interface DependencyInfo {
  name: string;
  version: string;
  size: number;
  usageCount: number;
  isDevDependency: boolean;
  alternatives?: string[];
}

interface DuplicateInfo {
  module: string;
  instances: number;
  totalSize: number;
  chunks: string[];
}

interface UnusedExportInfo {
  module: string;
  exports: string[];
  potentialSavings: number;
}

class BundleAnalyzer {
  private stats: BundleStats | null = null;

  async analyzeBundleStats(statsPath: string): Promise<BundleStats> {
    try {
      // In a real implementation, this would parse webpack stats
      const response = await fetch(statsPath);
      const rawStats = await response.json();
      
      this.stats = this.parseWebpackStats(rawStats);
      return this.stats;
    } catch (error) {
      console.error('Failed to analyze bundle stats:', error);
      throw error;
    }
  }

  private parseWebpackStats(rawStats: any): BundleStats {
    const chunks = this.parseChunks(rawStats.chunks || []);
    const dependencies = this.parseDependencies(rawStats.modules || []);
    const duplicates = this.findDuplicates(rawStats.modules || []);
    const unusedExports = this.findUnusedExports(rawStats.modules || []);

    return {
      totalSize: rawStats.assets?.reduce((sum: number, asset: any) => sum + asset.size, 0) || 0,
      gzippedSize: this.estimateGzippedSize(rawStats.assets || []),
      chunks,
      dependencies,
      duplicates,
      unusedExports
    };
  }

  private parseChunks(rawChunks: any[]): ChunkInfo[] {
    return rawChunks.map(chunk => ({
      name: chunk.names?.[0] || chunk.id,
      size: chunk.size || 0,
      gzippedSize: Math.round((chunk.size || 0) * 0.3), // Rough estimate
      modules: chunk.modules?.map((m: any) => m.name) || [],
      isAsync: chunk.initial === false,
      parents: chunk.parents || [],
      children: chunk.children || []
    }));
  }

  private parseDependencies(modules: any[]): DependencyInfo[] {
    const depMap = new Map<string, DependencyInfo>();

    modules.forEach(module => {
      if (module.name?.includes('node_modules')) {
        const match = module.name.match(/node_modules\/([^\/]+)/);
        if (match) {
          const depName = match[1];
          const existing = depMap.get(depName);
          
          if (existing) {
            existing.size += module.size || 0;
            existing.usageCount++;
          } else {
            depMap.set(depName, {
              name: depName,
              version: 'unknown',
              size: module.size || 0,
              usageCount: 1,
              isDevDependency: false
            });
          }
        }
      }
    });

    return Array.from(depMap.values()).sort((a, b) => b.size - a.size);
  }

  private findDuplicates(modules: any[]): DuplicateInfo[] {
    const moduleMap = new Map<string, { instances: number; totalSize: number; chunks: Set<string> }>();

    modules.forEach(module => {
      const normalizedName = this.normalizeModuleName(module.name);
      const existing = moduleMap.get(normalizedName);
      
      if (existing) {
        existing.instances++;
        existing.totalSize += module.size || 0;
        module.chunks?.forEach((chunk: string) => existing.chunks.add(chunk));
      } else {
        moduleMap.set(normalizedName, {
          instances: 1,
          totalSize: module.size || 0,
          chunks: new Set(module.chunks || [])
        });
      }
    });

    return Array.from(moduleMap.entries())
      .filter(([_, info]) => info.instances > 1)
      .map(([name, info]) => ({
        module: name,
        instances: info.instances,
        totalSize: info.totalSize,
        chunks: Array.from(info.chunks)
      }))
      .sort((a, b) => b.totalSize - a.totalSize);
  }

  private findUnusedExports(modules: any[]): UnusedExportInfo[] {
    // This would require more sophisticated analysis in a real implementation
    // For now, return empty array
    return [];
  }

  private normalizeModuleName(name: string): string {
    if (!name) return '';
    
    // Remove webpack-specific prefixes and suffixes
    return name
      .replace(/^\.\//, '')
      .replace(/\?.*$/, '')
      .replace(/!.*$/, '');
  }

  private estimateGzippedSize(assets: any[]): number {
    return Math.round(assets.reduce((sum, asset) => sum + asset.size, 0) * 0.3);
  }

  // Generate optimization recommendations
  generateRecommendations(): OptimizationRecommendation[] {
    if (!this.stats) return [];

    const recommendations: OptimizationRecommendation[] = [];

    // Large dependencies
    const largeDeps = this.stats.dependencies.filter(dep => dep.size > 100000);
    if (largeDeps.length > 0) {
      recommendations.push({
        type: 'large-dependencies',
        severity: 'high',
        title: 'Large Dependencies Detected',
        description: `Found ${largeDeps.length} dependencies over 100KB`,
        details: largeDeps.map(dep => `${dep.name}: ${this.formatSize(dep.size)}`),
        action: 'Consider alternatives or lazy loading for large dependencies'
      });
    }

    // Duplicate modules
    if (this.stats.duplicates.length > 0) {
      const totalWaste = this.stats.duplicates.reduce((sum, dup) => sum + dup.totalSize, 0);
      recommendations.push({
        type: 'duplicates',
        severity: 'medium',
        title: 'Duplicate Modules Found',
        description: `${this.stats.duplicates.length} modules are duplicated, wasting ${this.formatSize(totalWaste)}`,
        details: this.stats.duplicates.map(dup => `${dup.module}: ${dup.instances} instances`),
        action: 'Use webpack optimization.splitChunks to deduplicate modules'
      });
    }

    // Large chunks
    const largeChunks = this.stats.chunks.filter(chunk => chunk.size > 500000);
    if (largeChunks.length > 0) {
      recommendations.push({
        type: 'large-chunks',
        severity: 'high',
        title: 'Large Chunks Detected',
        description: `Found ${largeChunks.length} chunks over 500KB`,
        details: largeChunks.map(chunk => `${chunk.name}: ${this.formatSize(chunk.size)}`),
        action: 'Split large chunks using dynamic imports or code splitting'
      });
    }

    // Too many chunks
    if (this.stats.chunks.length > 20) {
      recommendations.push({
        type: 'too-many-chunks',
        severity: 'low',
        title: 'Many Small Chunks',
        description: `${this.stats.chunks.length} chunks detected, which may impact loading performance`,
        details: [`Average chunk size: ${this.formatSize(this.stats.totalSize / this.stats.chunks.length)}`],
        action: 'Consider consolidating small chunks to reduce HTTP requests'
      });
    }

    return recommendations;
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Generate bundle report
  generateReport(): BundleReport {
    if (!this.stats) throw new Error('No stats available. Run analyzeBundleStats first.');

    return {
      summary: {
        totalSize: this.formatSize(this.stats.totalSize),
        gzippedSize: this.formatSize(this.stats.gzippedSize),
        chunkCount: this.stats.chunks.length,
        dependencyCount: this.stats.dependencies.length
      },
      topDependencies: this.stats.dependencies.slice(0, 10),
      largestChunks: this.stats.chunks
        .sort((a, b) => b.size - a.size)
        .slice(0, 10),
      duplicates: this.stats.duplicates,
      recommendations: this.generateRecommendations(),
      generatedAt: new Date().toISOString()
    };
  }
}

interface OptimizationRecommendation {
  type: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  details: string[];
  action: string;
}

interface BundleReport {
  summary: {
    totalSize: string;
    gzippedSize: string;
    chunkCount: number;
    dependencyCount: number;
  };
  topDependencies: DependencyInfo[];
  largestChunks: ChunkInfo[];
  duplicates: DuplicateInfo[];
  recommendations: OptimizationRecommendation[];
  generatedAt: string;
}

// Tree shaking analyzer
export class TreeShakingAnalyzer {
  async analyzeUnusedCode(entryPoints: string[]): Promise<UnusedCodeReport> {
    // This would integrate with tools like webpack-bundle-analyzer
    // or custom AST analysis to find unused code
    
    return {
      unusedFiles: [],
      unusedExports: [],
      potentialSavings: 0,
      recommendations: []
    };
  }
}

interface UnusedCodeReport {
  unusedFiles: string[];
  unusedExports: { file: string; exports: string[] }[];
  potentialSavings: number;
  recommendations: string[];
}

// Code splitting optimizer
export class CodeSplittingOptimizer {
  analyzeChunkStrategy(chunks: ChunkInfo[]): ChunkOptimizationPlan {
    const plan: ChunkOptimizationPlan = {
      currentStrategy: this.identifyCurrentStrategy(chunks),
      recommendations: [],
      proposedChunks: []
    };

    // Analyze vendor chunks
    const vendorChunks = chunks.filter(chunk => 
      chunk.modules.some(module => module.includes('node_modules'))
    );

    if (vendorChunks.length === 0) {
      plan.recommendations.push({
        type: 'create-vendor-chunk',
        description: 'Create a separate vendor chunk for third-party dependencies',
        impact: 'Improves caching and reduces main bundle size'
      });
    }

    // Analyze route-based splitting
    const routeChunks = chunks.filter(chunk => chunk.isAsync);
    if (routeChunks.length < 3) {
      plan.recommendations.push({
        type: 'route-splitting',
        description: 'Implement route-based code splitting for better loading performance',
        impact: 'Reduces initial bundle size and improves page load times'
      });
    }

    return plan;
  }

  private identifyCurrentStrategy(chunks: ChunkInfo[]): string {
    const hasVendorChunk = chunks.some(chunk => chunk.name.includes('vendor'));
    const hasAsyncChunks = chunks.some(chunk => chunk.isAsync);
    
    if (hasVendorChunk && hasAsyncChunks) return 'advanced';
    if (hasAsyncChunks) return 'basic-splitting';
    if (hasVendorChunk) return 'vendor-splitting';
    return 'single-bundle';
  }
}

interface ChunkOptimizationPlan {
  currentStrategy: string;
  recommendations: {
    type: string;
    description: string;
    impact: string;
  }[];
  proposedChunks: {
    name: string;
    modules: string[];
    estimatedSize: number;
  }[];
}

export const bundleAnalyzer = new BundleAnalyzer();
export const treeShakingAnalyzer = new TreeShakingAnalyzer();
export const codeSplittingOptimizer = new CodeSplittingOptimizer();