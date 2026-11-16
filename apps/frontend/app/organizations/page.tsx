import {RelationshipPage} from '../../components/relationship-page';
import type {DirectoryParams} from '../../lib/relationship-directory';
export default async function Organizations({searchParams}:{searchParams:Promise<DirectoryParams>}) {
  return <RelationshipPage kind="organization" params={await searchParams}/>;
}
