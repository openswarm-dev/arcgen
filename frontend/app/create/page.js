import CreateFlow from '@/components/create/CreateFlow';
import shellStyles from '@/components/layout/AppShell.module.css';

export const metadata = {
  title: 'Create',
  description: 'Generate viral video clips for X creators with Wan 3.0.',
};

export default function CreatePage() {
  return (
    <div className={`${shellStyles.pageSection} ${shellStyles.pageSectionWide}`}>
      <CreateFlow />
    </div>
  );
}
