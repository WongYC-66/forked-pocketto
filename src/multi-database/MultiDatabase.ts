import { DatabaseCustomConfig, DatabaseManager, PouchDBConfig, syncDatabases } from '..';
import { BaseModel } from '..';

type MultiDatabaseConfig = {
    name: string;
    period: string;
    localDatabaseName: string;
    config: PouchDBConfig;
};

export default class MultipleDatabase {
    static dbName: string = 'master'; // Main database name

    // Store daily data like Transaction, Order, etc.
    static databases: MultiDatabaseConfig[] = [];

    static async createDatabase(
        period: string,
        remoteDatabaseCreation?: (periodDbConfig: PouchDBConfig) => PouchDBConfig | Promise<PouchDBConfig | undefined>
    ): Promise<MultiDatabaseConfig> {
        const mainDbName = this.dbName;
        const mainDbConfig = DatabaseManager.databases[mainDbName]?.config;
        if (!mainDbConfig) throw new Error(`Database ${mainDbName} not found`);

        const periodDbName = `${mainDbName}-${period}`;
        const periodDbConfig = {
            adapter: mainDbConfig.adapter,
            password: mainDbConfig.auth?.password,
            silentConnect: mainDbConfig.silentConnect,
            dbName: periodDbName,
        };
        let periodDb: PouchDB.Database & DatabaseCustomConfig | null;
        try {
            periodDb = DatabaseManager.get(periodDbName);
        } catch (error) {
            periodDb = null;
        }
        if (!periodDb) {
            periodDb = await DatabaseManager.connect(
                periodDbName,
                periodDbConfig
            );
            periodDb!.config = periodDbConfig;
        }

        const remoteDbConfig = await remoteDatabaseCreation?.(periodDbConfig);
        if (remoteDbConfig?.dbName && periodDb?.config?.dbName) {
            await DatabaseManager.connect(remoteDbConfig.dbName, remoteDbConfig);
            syncDatabases(periodDb.config?.dbName, remoteDbConfig.dbName);
        }

        const result = {
            name: mainDbName,
            period,
            localDatabaseName: `${mainDbName}-${period}`,
            config: periodDbConfig,
        };
        this.databases.push(result);

        return result;
    }

    static async getDatabase(period: string): Promise<MultiDatabaseConfig | undefined> {
        return this.databases.find(db => db.period === period);
    }
}