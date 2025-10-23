import React, { useEffect, useState } from 'react';
import { FileText, DollarSign, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Proposal {
  id: string;
  title: string;
  client: string;
  client_email: string;
  status: string;
  value: number;
  description: string;
  template: string;
  created_at: string;
  updated_at: string;
}

interface PublicProposalViewProps {
  shareToken: string;
}

export function PublicProposalView({ shareToken }: PublicProposalViewProps) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProposal();
  }, [shareToken]);

  const loadProposal = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('proposals')
        .select('*')
        .eq('share_token', shareToken)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Proposal not found');
        return;
      }

      setProposal(data);

      await supabase
        .from('proposals')
        .update({ opens: (data.opens || 0) + 1 })
        .eq('id', data.id);
    } catch (err) {
      console.error('Error loading proposal:', err);
      setError('Failed to load proposal');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Proposal Not Found</h2>
          <p className="text-slate-600">
            {error || 'The proposal you are looking for does not exist or has been removed.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-12">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-3">{proposal.title}</h1>
                <div className="flex items-center gap-2 text-slate-200">
                  <span className="text-lg">For: {proposal.client}</span>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getStatusColor(proposal.status)}`}>
                {getStatusIcon(proposal.status)}
                <span className="font-semibold capitalize">{proposal.status}</span>
              </div>
            </div>
          </div>

          <div className="px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-slate-600 font-medium">Project Value</p>
                  <p className="text-2xl font-bold text-slate-900">
                    ${proposal.value.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Calendar className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-600 font-medium">Created</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {new Date(proposal.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <FileText className="w-8 h-8 text-slate-600" />
                <div>
                  <p className="text-sm text-slate-600 font-medium">Template</p>
                  <p className="text-lg font-semibold text-slate-900 capitalize">
                    {proposal.template}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Proposal Details</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {proposal.description}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 px-8 py-6 border-t border-slate-200">
            <p className="text-sm text-slate-600 text-center">
              Have questions about this proposal? Contact us at{' '}
              <a href={`mailto:${proposal.client_email}`} className="text-slate-900 font-semibold hover:underline">
                {proposal.client_email}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
