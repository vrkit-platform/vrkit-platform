import { PageContent } from "../../components/page"

// ----------------------------------------------------------------------

type Props = {
  title?: string;
};

export function BlankView({ title = 'Blank' }: Props) {
  return (
    <PageContent maxWidth="xl">
    </PageContent>
  );
}
