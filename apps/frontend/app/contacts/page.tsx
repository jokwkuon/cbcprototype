import {RelationshipPage} from '../../components/relationship-page';
import type {DirectoryParams} from '../../lib/relationship-directory';
export default async function Contacts({searchParams}:{searchParams:Promise<DirectoryParams>}) {
  return <RelationshipPage kind="contact" params={await searchParams}/>;
}
