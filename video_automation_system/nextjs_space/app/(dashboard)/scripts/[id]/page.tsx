import { ScriptDetailContent } from '@/components/script-detail-content'

export default function ScriptDetailPage({ params }: { params: { id: string } }) {
  return <ScriptDetailContent id={params?.id ?? ''} />
}
