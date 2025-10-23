import { supabase } from '../lib/supabase';

export interface TrainingDocument {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  uploaded_at: string;
}

export interface ExtractedPattern {
  id: string;
  document_id: string;
  pattern_type: string;
  pattern_data: Record<string, any>;
  confidence_score: number;
  created_at: string;
}

export const aiTrainingService = {
  async uploadTrainingDocument(
    fileName: string,
    fileSize: number,
    fileType: string,
    content: string
  ): Promise<TrainingDocument> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('training_documents')
      .insert([
        {
          file_name: fileName,
          file_size: fileSize,
          file_type: fileType,
          content: content,
          status: 'pending',
          user_id: user?.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getTrainingDocuments(): Promise<TrainingDocument[]> {
    const { data, error } = await supabase
      .from('training_documents')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async analyzeDocuments(
    documents: Array<{ id: string; fileName: string; content: string }>
  ): Promise<any> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/analyze-documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        documents,
        analysisType: 'proposal_patterns',
      }),
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`);
    }

    return response.json();
  },

  async updateDocumentStatus(
    documentId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed'
  ): Promise<void> {
    const { error } = await supabase
      .from('training_documents')
      .update({ status })
      .eq('id', documentId);

    if (error) throw error;
  },

  async saveExtractedPatterns(
    documentId: string,
    patterns: Array<{
      pattern_type: string;
      pattern_data: Record<string, any>;
      confidence_score: number;
    }>
  ): Promise<void> {
    const patternsToInsert = patterns.map((pattern) => ({
      document_id: documentId,
      pattern_type: pattern.pattern_type,
      pattern_data: pattern.pattern_data,
      confidence_score: pattern.confidence_score,
    }));

    const { error } = await supabase
      .from('extracted_patterns')
      .insert(patternsToInsert);

    if (error) throw error;
  },

  async getExtractedPatterns(documentId?: string): Promise<ExtractedPattern[]> {
    let query = supabase.from('extracted_patterns').select('*');

    if (documentId) {
      query = query.eq('document_id', documentId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async deleteTrainingDocument(documentId: string): Promise<void> {
    const { error } = await supabase
      .from('training_documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
  },

  async extractTextFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      if (file.type === 'text/plain' || file.type === 'text/markdown') {
        reader.readAsText(file);
      } else {
        resolve(`[Binary file: ${file.name}]`);
      }
    });
  },
};
