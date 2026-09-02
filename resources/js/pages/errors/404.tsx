import ErrorPage from './error-page';

export default function NotFound(props: Record<string, unknown>) {
    return <ErrorPage {...props} status={404} />;
}
