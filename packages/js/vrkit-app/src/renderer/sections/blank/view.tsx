import { AppContent } from "../../components/app"

// ----------------------------------------------------------------------

type Props = {
  title?: string;
};

export function BlankView({ title = 'Blank' }: Props) {
  return (
    <AppContent maxWidth="xl">
    </AppContent>
  );
}
