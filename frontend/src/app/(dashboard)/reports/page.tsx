'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Plus, Calendar, TrendingUp, Shield, Calculator } from 'lucide-react';
import { Header, Button } from '@/components/layout/header';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { reportApi } from '@/lib/api-client';
import type { Report } from '@/types';

const reportIconMap: Record<string, React.ElementType> = {
  performance: TrendingUp,
  tax: Calculator,
  risk: Shield,
  comprehensive: FileText,
};

const reportTypes = [
  {
    type: 'performance',
    title: 'Performance Report',
    description: 'Detailed analysis of portfolio returns, benchmarks, and attribution',
    icon: TrendingUp,
    color: 'bg-accent-primary/20 text-accent-primary',
  },
  {
    type: 'tax',
    title: 'Tax Report',
    description: 'Capital gains, losses, and tax optimization recommendations',
    icon: Calculator,
    color: 'bg-warning/20 text-warning',
  },
  {
    type: 'risk',
    title: 'Risk Report',
    description: 'Portfolio risk metrics, stress tests, and volatility analysis',
    icon: Shield,
    color: 'bg-accent-secondary/20 text-accent-secondary',
  },
  {
    type: 'comprehensive',
    title: 'Comprehensive Report',
    description: 'Complete portfolio analysis including all metrics and insights',
    icon: FileText,
    color: 'bg-success/20 text-success',
  },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await reportApi.list();
      const data = res.data;
      setReports(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async (type: string) => {
    setGenerating(true);
    try {
      await reportApi.generate({ type });
      await fetchReports();
    } catch {
      // silently fail
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (id: string, format: 'pdf' | 'csv', title: string) => {
    try {
      const res = await reportApi.download(id, format);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // silently fail
    }
  };

  return (
    <>
      <Header
        title="Reports & Insights"
        subtitle="Generate and download detailed portfolio reports"
        actions={
          <Button variant="primary" disabled={generating}>
            <Plus className="w-4 h-4" />
            {generating ? 'Generating...' : 'Generate Report'}
          </Button>
        }
      />

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <Card
              key={report.type}
              className="cursor-pointer hover:border-accent-primary transition-all duration-200 hover:-translate-y-1"
              onClick={() => handleGenerate(report.type)}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${report.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">{report.title}</h3>
              <p className="text-sm text-text-secondary">{report.description}</p>
            </Card>
          );
        })}
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader title="Recent Reports" />
        {loading ? (
          <div className="text-sm text-text-muted text-center py-8">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="text-sm text-text-muted text-center py-8">
            No reports yet. Click a report type above to generate one.
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const Icon = reportIconMap[report.type] ?? FileText;
              return (
                <div
                  key={report.id}
                  className="flex items-center gap-4 p-4 bg-background-tertiary rounded-xl hover:bg-background-tertiary/80 transition-colors"
                >
                  <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-accent-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{report.title}</h4>
                      <Badge
                        variant={report.status === 'completed' ? 'positive' : report.status === 'failed' ? 'negative' : 'warning'}
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-text-muted">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {report.status === 'completed' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(report.id, 'pdf', report.title)}
                        className="flex items-center gap-2 px-4 py-2 bg-accent-primary/10 text-accent-primary rounded-lg hover:bg-accent-primary/20 transition-colors text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                      <button
                        onClick={() => handleDownload(report.id, 'csv', report.title)}
                        className="flex items-center gap-2 px-4 py-2 bg-background-secondary text-text-secondary rounded-lg hover:bg-background-primary transition-colors text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        CSV
                      </button>
                    </div>
                  ) : report.status === 'generating' || report.status === 'pending' ? (
                    <div className="flex items-center gap-2 text-warning">
                      <div className="w-4 h-4 border-2 border-warning border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Generating...</span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
