import ErrorPage from './error-page';

export default function Forbidden(props: Record<string, unknown>) {
    return <ErrorPage {...props} status={403} />;
}
