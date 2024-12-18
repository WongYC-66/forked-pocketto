import { Model } from 'src/model/Model';
import { BelongsTo } from 'src/index';
import { Relational } from 'src/model/ModelDecorator';
import { ChildUser } from './ChildUser';

const dbName = 'model-child';
@Relational
export class ChildIdentityCard extends Model {
    static dbName = dbName;

    userId!: string;
    number!: string;
    @BelongsTo('ChildUser', 'userId', 'id') user?: ChildUser;
}