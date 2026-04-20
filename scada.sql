-- SCADA database DDL
-- Full schema reference. Claude Code: consult this when you need exact column names, types, or constraints.
-- Source of truth — do not modify unless the upstream schema changes.

-- DROP SCHEMA dbo;
CREATE SCHEMA dbo;
-- [Edge DB].dbo.ALARMHISTORY definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.ALARMHISTORY;
CREATE TABLE [Edge DB].dbo.ALARMHISTORY (
	Al_Start_Time datetime2 NULL,
	Al_Start_Time_ms int NULL,
	Al_Tag varchar(255) COLLATE Modern_Spanish_CI_AS NULL,
	Al_Message varchar(255) COLLATE Modern_Spanish_CI_AS NULL,
	Al_Ack int NULL,
	Al_Active int NULL,
	Al_Tag_Value float NULL,
	Al_Prev_Tag_Value float NULL,
	Al_Group int NULL,
	Al_Priority int NULL,
	Al_Selection varchar(255) COLLATE Modern_Spanish_CI_AS NULL,
	Al_Type int NULL,
	Al_Ack_Req int NULL,
	Al_Norm_Time datetime2 NULL,
	Al_Norm_Time_ms int NULL,
	Al_Ack_Time datetime2 NULL,
	Al_Ack_Time_ms int NULL,
	Al_User varchar(255) COLLATE Modern_Spanish_CI_AS NULL,
	Al_User_Comment varchar(255) COLLATE Modern_Spanish_CI_AS NULL,
	Al_User_Full varchar(255) COLLATE Modern_Spanish_CI_AS NULL,
	Al_Station varchar(255) COLLATE Modern_Spanish_CI_AS NULL,
	Al_Deleted int NULL,
	Al_Event_Time datetime2 NULL,
	Al_Event_Time_ms int NULL,
	Last_Update datetime2 NULL,
	Last_Update_ms int NULL
);
 CREATE NONCLUSTERED INDEX SEARCH_INDEX ON Edge DB.dbo.ALARMHISTORY (  Al_Event_Time ASC  , Al_Event_Time_ms ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;
-- [Edge DB].dbo.AlertasRepeticion definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.AlertasRepeticion;
CREATE TABLE [Edge DB].dbo.AlertasRepeticion (
	Id int IDENTITY(1,1) NOT NULL,
	NombreTabla nvarchar(128) COLLATE Modern_Spanish_CI_AS NULL,
	Columna nvarchar(128) COLLATE Modern_Spanish_CI_AS NULL,
	ValorRepetido float NULL,
	CantidadRepeticiones int NULL,
	FechaAlerta datetime NULL,
	Comentario nvarchar(255) COLLATE Modern_Spanish_CI_AS NULL,
	CONSTRAINT PK__AlertasR__3214EC0794E1D6E0 PRIMARY KEY (Id)
);
-- [Edge DB].dbo.Alimentadores definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Alimentadores;
CREATE TABLE [Edge DB].dbo.Alimentadores (
	Time_Stamp datetime2 NOT NULL,
	AL01_Energy bigint NULL,
	AL02_Energy bigint NULL,
	AL03_Energy bigint NULL,
	AL04_Energy bigint NULL,
	AL05_Energy bigint NULL,
	AL06_Energy bigint NULL,
	AL07_Energy bigint NULL,
	AL08_Energy bigint NULL,
	AL09_Energy bigint NULL,
	AL10_Energy bigint NULL,
	AL11_Energy bigint NULL,
	AL12_Energy bigint NULL,
	AL13_Energy bigint NULL,
	AL14_Energy bigint NULL,
	AL15_Energy bigint NULL,
	BC02_Energy bigint NULL,
	CONSTRAINT PK_Alimentadores PRIMARY KEY (Time_Stamp)
);
-- [Edge DB].dbo.Auditoria_Tabla definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Auditoria_Tabla;
CREATE TABLE [Edge DB].dbo.Auditoria_Tabla (
	Id int IDENTITY(1,1) NOT NULL,
	Tabla nvarchar(100) COLLATE Modern_Spanish_CI_AS NULL,
	Accion nvarchar(10) COLLATE Modern_Spanish_CI_AS NULL,
	Usuario nvarchar(100) COLLATE Modern_Spanish_CI_AS NULL,
	Fecha datetime NULL,
	Detalles nvarchar(MAX) COLLATE Modern_Spanish_CI_AS NULL,
	CONSTRAINT PK__Auditori__3214EC076395060C PRIMARY KEY (Id)
);
-- [Edge DB].dbo.Auxiliar definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Auxiliar;
CREATE TABLE [Edge DB].dbo.Auxiliar (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	Servicios_Auxiliares_Total_Power float NULL,
	Servicios_Auxiliares_Energia float NULL,
	Servicios_Auxiliares_Total_Power_Norte float NULL,
	Servicios_Auxiliares_Energia_Norte float NULL,
	CONSTRAINT PK__Auxiliar__5ADE1933BEEAB2DE PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Consumo_Saz_CW1 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Consumo_Saz_CW1;
CREATE TABLE [Edge DB].dbo.Consumo_Saz_CW1 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	Medicion_Consumo_Movil_VRS float NULL,
	Medicion_Consumo_Movil_VST float NULL,
	Medicion_Consumo_Movil_VTR float NULL,
	Medicion_Consumo_Movil_IR float NULL,
	Medicion_Consumo_Movil_IS float NULL,
	Medicion_Consumo_Movil_IT float NULL,
	Medicion_Consumo_Movil_Kw float NULL,
	Medicion_Consumo_Movil_Energia float NULL,
	Medicion_Consumo_Movil_IN float NULL,
	CONSTRAINT PK__Consumo___5ADE193312E796EE PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.EVENTHISTORY definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.EVENTHISTORY;
CREATE TABLE [Edge DB].dbo.EVENTHISTORY (
	Ev_Type int NULL,
	Ev_Time datetime2 NULL,
	Ev_Time_ms int NULL,
	Ev_Info varchar(255) COLLATE Modern_Spanish_CI_AS NULL,
	Ev_User varchar(255) COLLATE Modern_Spanish_CI_AS NULL,
	Ev_User_Full varchar(255) COLLATE Modern_Spanish_CI_AS NULL,
	Ev_Message varchar(255) COLLATE Modern_Spanish_CI_AS NULL,
	Ev_Value varchar(255) COLLATE Modern_Spanish_CI_AS NULL,
	Ev_Prev_Value varchar(255) COLLATE Modern_Spanish_CI_AS NULL,
	Ev_Station varchar(255) COLLATE Modern_Spanish_CI_AS NULL,
	Ev_Comment varchar(255) COLLATE Modern_Spanish_CI_AS NULL,
	Ev_Source varchar(255) COLLATE Modern_Spanish_CI_AS NULL,
	Ev_Deleted int NULL,
	Last_Update datetime2 NULL,
	Last_Update_ms int NULL
);
 CREATE NONCLUSTERED INDEX SEARCH_INDEX ON Edge DB.dbo.EVENTHISTORY (  Ev_Time ASC  , Ev_Time_ms ASC  )  
	 WITH (  PAD_INDEX = OFF ,FILLFACTOR = 100  ,SORT_IN_TEMPDB = OFF , IGNORE_DUP_KEY = OFF , STATISTICS_NORECOMPUTE = OFF , ONLINE = OFF , ALLOW_ROW_LOCKS = ON , ALLOW_PAGE_LOCKS = ON  )
	 ON [PRIMARY ] ;
-- [Edge DB].dbo.H2Sense_A1 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_A1;
CREATE TABLE [Edge DB].dbo.H2Sense_A1 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	A1_Temperature_PCB float NULL,
	A1_Temperature_Oil float NULL,
	A1_Pressure_Oil float NULL,
	A1_Water_content_Oil float NULL,
	A1_Water_activity_Oil float NULL,
	A1_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933C0E67B14 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_A2 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_A2;
CREATE TABLE [Edge DB].dbo.H2Sense_A2 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	A2_Temperature_PCB float NULL,
	A2_Temperature_Oil float NULL,
	A2_Pressure_Oil float NULL,
	A2_Water_content_Oil float NULL,
	A2_Water_activity_Oil float NULL,
	A2_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE19333B67026E PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_A3 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_A3;
CREATE TABLE [Edge DB].dbo.H2Sense_A3 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	A3_Temperature_PCB float NULL,
	A3_Temperature_Oil float NULL,
	A3_Pressure_Oil float NULL,
	A3_Water_content_Oil float NULL,
	A3_Water_activity_Oil float NULL,
	A3_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933249B7DEF PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_B1 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_B1;
CREATE TABLE [Edge DB].dbo.H2Sense_B1 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	B1_Temperature_PCB float NULL,
	B1_Temperature_Oil float NULL,
	B1_Pressure_Oil float NULL,
	B1_Water_content_Oil float NULL,
	B1_Water_activity_Oil float NULL,
	B1_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE193324F91FA0 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_B2 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_B2;
CREATE TABLE [Edge DB].dbo.H2Sense_B2 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	B2_Temperature_PCB float NULL,
	B2_Temperature_Oil float NULL,
	B2_Pressure_Oil float NULL,
	B2_Water_content_Oil float NULL,
	B2_Water_activity_Oil float NULL,
	B2_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933AFFBE169 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_B3 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_B3;
CREATE TABLE [Edge DB].dbo.H2Sense_B3 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	B3_Temperature_PCB float NULL,
	B3_Temperature_Oil float NULL,
	B3_Pressure_Oil float NULL,
	B3_Water_content_Oil float NULL,
	B3_Water_activity_Oil float NULL,
	B3_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933E01A2C8E PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_C1 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_C1;
CREATE TABLE [Edge DB].dbo.H2Sense_C1 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	C1_Temperature_PCB float NULL,
	C1_Temperature_Oil float NULL,
	C1_Pressure_Oil float NULL,
	C1_Water_content_Oil float NULL,
	C1_Water_activity_Oil float NULL,
	C1_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE19334EDDA25E PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_C2 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_C2;
CREATE TABLE [Edge DB].dbo.H2Sense_C2 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	C2_Temperature_PCB float NULL,
	C2_Temperature_Oil float NULL,
	C2_Pressure_Oil float NULL,
	C2_Water_content_Oil float NULL,
	C2_Water_activity_Oil float NULL,
	C2_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933164D5742 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_D1 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_D1;
CREATE TABLE [Edge DB].dbo.H2Sense_D1 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	D1_Temperature_PCB float NULL,
	D1_Temperature_Oil float NULL,
	D1_Pressure_Oil float NULL,
	D1_Water_content_Oil float NULL,
	D1_Water_activity_Oil float NULL,
	D1_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE19333ACC4732 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_D2 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_D2;
CREATE TABLE [Edge DB].dbo.H2Sense_D2 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	D2_Temperature_PCB float NULL,
	D2_Temperature_Oil float NULL,
	D2_Pressure_Oil float NULL,
	D2_Water_content_Oil float NULL,
	D2_Water_activity_Oil float NULL,
	D2_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933FD806B8A PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_D3 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_D3;
CREATE TABLE [Edge DB].dbo.H2Sense_D3 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	D3_Temperature_PCB float NULL,
	D3_Temperature_Oil float NULL,
	D3_Pressure_Oil float NULL,
	D3_Water_content_Oil float NULL,
	D3_Water_activity_Oil float NULL,
	D3_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933FF6B5706 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_F2 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_F2;
CREATE TABLE [Edge DB].dbo.H2Sense_F2 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	F2_Temperature_PCB float NULL,
	F2_Temperature_Oil float NULL,
	F2_Pressure_Oil float NULL,
	F2_Water_content_Oil float NULL,
	F2_Water_activity_Oil float NULL,
	F2_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933C175B31C PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_F3 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_F3;
CREATE TABLE [Edge DB].dbo.H2Sense_F3 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	F3_Temperature_PCB float NULL,
	F3_Temperature_Oil float NULL,
	F3_Pressure_Oil float NULL,
	F3_Water_content_Oil float NULL,
	F3_Water_activity_Oil float NULL,
	F3_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE19339E5ADB68 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_G1 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_G1;
CREATE TABLE [Edge DB].dbo.H2Sense_G1 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	G1_Temperature_PCB float NULL,
	G1_Temperature_Oil float NULL,
	G1_Pressure_Oil float NULL,
	G1_Water_content_Oil float NULL,
	G1_Water_activity_Oil float NULL,
	G1_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933DCF76CAD PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_G2 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_G2;
CREATE TABLE [Edge DB].dbo.H2Sense_G2 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	G2_Temperature_PCB float NULL,
	G2_Temperature_Oil float NULL,
	G2_Pressure_Oil float NULL,
	G2_Water_content_Oil float NULL,
	G2_Water_activity_Oil float NULL,
	G2_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE193382D21334 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_M1 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_M1;
CREATE TABLE [Edge DB].dbo.H2Sense_M1 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M1_Temperature_PCB float NULL,
	M1_Temperature_Oil float NULL,
	M1_Pressure_Oil float NULL,
	M1_Water_content_Oil float NULL,
	M1_Water_activity_Oil float NULL,
	M1_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE19332AC1CB91 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_M10 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_M10;
CREATE TABLE [Edge DB].dbo.H2Sense_M10 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M10_Temperature_PCB float NULL,
	M10_Temperature_Oil float NULL,
	M10_Pressure_Oil float NULL,
	M10_Water_content_Oil float NULL,
	M10_Water_activity_Oil float NULL,
	M10_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933E5F518E7 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_M2 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_M2;
CREATE TABLE [Edge DB].dbo.H2Sense_M2 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M2_Temperature_PCB float NULL,
	M2_Temperature_Oil float NULL,
	M2_Pressure_Oil float NULL,
	M2_Water_content_Oil float NULL,
	M2_Water_activity_Oil float NULL,
	M2_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933D4717CEC PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_M3 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_M3;
CREATE TABLE [Edge DB].dbo.H2Sense_M3 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M3_Temperature_PCB float NULL,
	M3_Temperature_Oil float NULL,
	M3_Pressure_Oil float NULL,
	M3_Water_content_Oil float NULL,
	M3_Water_activity_Oil float NULL,
	M3_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE193317FAFAFB PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_M4 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_M4;
CREATE TABLE [Edge DB].dbo.H2Sense_M4 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M4_Temperature_PCB float NULL,
	M4_Temperature_Oil float NULL,
	M4_Pressure_Oil float NULL,
	M4_Water_content_Oil float NULL,
	M4_Water_activity_Oil float NULL,
	M4_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE193328C4434B PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_M5 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_M5;
CREATE TABLE [Edge DB].dbo.H2Sense_M5 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M5_Temperature_PCB float NULL,
	M5_Temperature_Oil float NULL,
	M5_Pressure_Oil float NULL,
	M5_Water_content_Oil float NULL,
	M5_Water_activity_Oil float NULL,
	M5_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE19330049DEAE PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_M6 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_M6;
CREATE TABLE [Edge DB].dbo.H2Sense_M6 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M6_Temperature_PCB float NULL,
	M6_Temperature_Oil float NULL,
	M6_Pressure_Oil float NULL,
	M6_Water_content_Oil float NULL,
	M6_Water_activity_Oil float NULL,
	M6_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933781BF385 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_M7 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_M7;
CREATE TABLE [Edge DB].dbo.H2Sense_M7 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M7_Temperature_PCB float NULL,
	M7_Temperature_Oil float NULL,
	M7_Pressure_Oil float NULL,
	M7_Water_content_Oil float NULL,
	M7_Water_activity_Oil float NULL,
	M7_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933B881EA1E PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_M8 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_M8;
CREATE TABLE [Edge DB].dbo.H2Sense_M8 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M8_Temperature_PCB float NULL,
	M8_Temperature_Oil float NULL,
	M8_Pressure_Oil float NULL,
	M8_Water_content_Oil float NULL,
	M8_Water_activity_Oil float NULL,
	M8_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE19333A23D9E8 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_M9 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_M9;
CREATE TABLE [Edge DB].dbo.H2Sense_M9 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M9_Temperature_PCB float NULL,
	M9_Temperature_Oil float NULL,
	M9_Pressure_Oil float NULL,
	M9_Water_content_Oil float NULL,
	M9_Water_activity_Oil float NULL,
	M9_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE19335DC68B22 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_N1 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_N1;
CREATE TABLE [Edge DB].dbo.H2Sense_N1 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N1_Temperature_Oil float NULL,
	N1_Temperature_PCB float NULL,
	N1_Hydrogen_Avg float NULL,
	N1_Pressure_Oil float NULL,
	N1_Water_content_Oil float NULL,
	N1_Water_activity_Oil float NULL,
	N1_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE193329CE0769 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_N10 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_N10;
CREATE TABLE [Edge DB].dbo.H2Sense_N10 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N10_Temperature_Oil float NULL,
	N10_Temperature_PCB float NULL,
	N10_Pressure_Oil float NULL,
	N10_Water_content_Oil float NULL,
	N10_Water_activity_Oil float NULL,
	N10_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933ECCD0E43 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_N11 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_N11;
CREATE TABLE [Edge DB].dbo.H2Sense_N11 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N11_Temperature_PCB float NULL,
	N11_Temperature_Oil float NULL,
	N11_Pressure_Oil float NULL,
	N11_Water_content_Oil float NULL,
	N11_Water_activity_Oil float NULL,
	N11_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933D7291D1D PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_N12 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_N12;
CREATE TABLE [Edge DB].dbo.H2Sense_N12 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N12_Temperature_Oil float NULL,
	N12_Temperature_PCB float NULL,
	N12_Pressure_Oil float NULL,
	N12_Water_content_Oil float NULL,
	N12_Water_activity_Oil float NULL,
	N12_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE193300D65EBF PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_N2 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_N2;
CREATE TABLE [Edge DB].dbo.H2Sense_N2 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N2_Temperature_Oil float NULL,
	N2_Temperature_PCB float NULL,
	N2_Pressure_Oil float NULL,
	N2_Water_content_Oil float NULL,
	N2_Water_activity_Oil float NULL,
	N2_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933A42CA5F4 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_N3 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_N3;
CREATE TABLE [Edge DB].dbo.H2Sense_N3 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N3_Temperature_Oil float NULL,
	N3_Temperature_PCB float NULL,
	N3_Pressure_Oil float NULL,
	N3_Water_content_Oil float NULL,
	N3_Water_activity_Oil float NULL,
	N3_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933A1EB53A1 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_N4 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_N4;
CREATE TABLE [Edge DB].dbo.H2Sense_N4 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N4_Temperature_Oil float NULL,
	N4_Temperature_PCB float NULL,
	N4_Pressure_Oil float NULL,
	N4_Water_content_Oil float NULL,
	N4_Water_activity_Oil float NULL,
	N4_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933356EF718 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_N5 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_N5;
CREATE TABLE [Edge DB].dbo.H2Sense_N5 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N5_Temperature_Oil float NULL,
	N5_Temperature_PCB float NULL,
	N5_Pressure_Oil float NULL,
	N5_Water_content_Oil float NULL,
	N5_Water_activity_Oil float NULL,
	N5_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933DEE22F2C PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_N6 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_N6;
CREATE TABLE [Edge DB].dbo.H2Sense_N6 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N6_Temperature_Oil float NULL,
	N6_Temperature_PCB float NULL,
	N6_Hydrogen_Avg float NULL,
	N6_Pressure_Oil float NULL,
	N6_Water_content_Oil float NULL,
	N6_Water_activity_Oil float NULL,
	N6_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933063A7B5F PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_N7 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_N7;
CREATE TABLE [Edge DB].dbo.H2Sense_N7 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N7_Temperature_Oil float NULL,
	N7_Temperature_PCB float NULL,
	N7_Pressure_Oil float NULL,
	N7_Water_content_Oil float NULL,
	N7_Water_activity_Oil float NULL,
	N7_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933A824D11A PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_N8 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_N8;
CREATE TABLE [Edge DB].dbo.H2Sense_N8 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N8_Temperature_Oil float NULL,
	N8_Temperature_PCB float NULL,
	N8_Pressure_Oil float NULL,
	N8_Water_content_Oil float NULL,
	N8_Water_activity_Oil float NULL,
	N8_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE193310A2FF55 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_N9 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_N9;
CREATE TABLE [Edge DB].dbo.H2Sense_N9 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N9_Temperature_Oil float NULL,
	N9_Temperature_PCB float NULL,
	N9_Pressure_Oil float NULL,
	N9_Water_content_Oil float NULL,
	N9_Water_activity_Oil float NULL,
	N9_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933CF99922A PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_S1_S2 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_S1_S2;
CREATE TABLE [Edge DB].dbo.H2Sense_S1_S2 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	S1_S2_Temperature_Oil float NULL,
	S1_S2_Temperature_PCB float NULL,
	S1_S2_Pressure_Oil float NULL,
	S1_S2_Water_content_Oil float NULL,
	S1_S2_Water_activity_Oil float NULL,
	S1_S2_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933F8CEE142 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_S5 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_S5;
CREATE TABLE [Edge DB].dbo.H2Sense_S5 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	S5_Temperature_Oil float NULL,
	S5_Temperature_PCB float NULL,
	S5_Pressure_Oil float NULL,
	S5_Water_content_Oil float NULL,
	S5_Water_activity_Oil float NULL,
	S5_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933A0393FD6 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_S7 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_S7;
CREATE TABLE [Edge DB].dbo.H2Sense_S7 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	S7_Temperature_Oil float NULL,
	S7_Temperature_PCB float NULL,
	S7_Pressure_Oil float NULL,
	S7_Water_content_Oil float NULL,
	S7_Water_activity_Oil float NULL,
	S7_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE19335BD7EC85 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_S8 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_S8;
CREATE TABLE [Edge DB].dbo.H2Sense_S8 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	S8_Temperature_Oil float NULL,
	S8_Temperature_PCB float NULL,
	S8_Pressure_Oil float NULL,
	S8_Water_content_Oil float NULL,
	S8_Water_activity_Oil float NULL,
	S8_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE193371877246 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.H2Sense_Z2 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.H2Sense_Z2;
CREATE TABLE [Edge DB].dbo.H2Sense_Z2 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	Z2_Temperature_PCB float NULL,
	Z2_Temperature_Oil float NULL,
	Z2_Pressure_Oil float NULL,
	Z2_Water_content_Oil float NULL,
	Z2_Water_activity_Oil float NULL,
	Z2_Hydrogen float NULL,
	CONSTRAINT PK__H2Sense___5ADE1933A0723477 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.PQM_Primario definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.PQM_Primario;
CREATE TABLE [Edge DB].dbo.PQM_Primario (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	PQM_Potencia_KW_Primario float NULL,
	PQM_Energía_Activa_KWh float NULL,
	SumaCliente_kW float NULL,
	SumaMediaTension float NULL,
	Trafo2_Total_Power float NULL,
	CONSTRAINT PK__PQM_Prim__5ADE193365839DD5 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.PUE_Registros definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.PUE_Registros;
CREATE TABLE [Edge DB].dbo.PUE_Registros (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	PUE_AltaMedia float NULL,
	PUE_MediaBaja float NULL,
	PUE_General float NULL,
	PUE_Alta_TrafosPotencia float NULL,
	PUE_TrafosPotencia_Media float NULL,
	PUE_AltaBaja float NULL,
	CONSTRAINT PK__PUE_Regi__5ADE1933C5241DDF PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_A11 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_A11;
CREATE TABLE [Edge DB].dbo.Registros_A11 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	A11_Dew_Point_Temperature float NULL,
	A11_TT01 float NULL,
	A11_PT01 float NULL,
	A11_FIT01 float NULL,
	A11_TT02 float NULL,
	A11_PT02 float NULL,
	A11_Internal_Humidity float NULL,
	A11_Internal_Temperature float NULL,
	A11_Potencia_Activa_Kw_lado_A float NULL,
	A11_Potencia_Activa_Kw_lado_B float NULL,
	A11_Energía_lado_A_Kwh int NULL,
	A11_Energía_lado_B_Kwh int NULL,
	A11_Energía_Contenedor_Kwh int NULL,
	A11_Factor_de_Potencia_lado_A float NULL,
	A11_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE19336044A6E7 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_A12 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_A12;
CREATE TABLE [Edge DB].dbo.Registros_A12 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	A12_Dew_Point_Temperature float NULL,
	A12_TT01 float NULL,
	A12_PT01 float NULL,
	A12_FIT01 float NULL,
	A12_TT02 float NULL,
	A12_PT02 float NULL,
	A12_Internal_Humidity float NULL,
	A12_Internal_Temperature float NULL,
	A12_Potencia_Activa_Kw_lado_A float NULL,
	A12_Potencia_Activa_Kw_lado_B float NULL,
	A12_Energía_lado_A_Kwh int NULL,
	A12_Energía_lado_B_Kwh int NULL,
	A12_Energía_Contenedor_Kwh int NULL,
	A12_Factor_de_Potencia_lado_A float NULL,
	A12_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE19330D7A1A3E PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_A21 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_A21;
CREATE TABLE [Edge DB].dbo.Registros_A21 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	A21_Dew_Point_Temperature float NULL,
	A21_TT01 float NULL,
	A21_PT01 float NULL,
	A21_FIT01 float NULL,
	A21_TT02 float NULL,
	A21_PT02 float NULL,
	A21_Internal_Humidity float NULL,
	A21_Internal_Temperature float NULL,
	A21_Potencia_Activa_Kw_lado_A float NULL,
	A21_Potencia_Activa_Kw_lado_B float NULL,
	A21_Energía_lado_A_Kwh int NULL,
	A21_Energía_lado_B_Kwh int NULL,
	A21_Energía_Contenedor_Kwh int NULL,
	A21_Vab_lado_A float NULL,
	A21_Vbc_lado_A float NULL,
	A21_Vac_lado_A float NULL,
	A21_Iab_lado_A int NULL,
	A21_Ibc_lado_A int NULL,
	A21_Iac_lado_A int NULL,
	A21_Iab_lado_B int NULL,
	A21_Ibc_lado_B int NULL,
	A21_Iac_lado_B int NULL,
	A21_Factor_de_Potencia_lado_A float NULL,
	A21_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE1933C81A7995 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_A22 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_A22;
CREATE TABLE [Edge DB].dbo.Registros_A22 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	A22_Dew_Point_Temperature float NULL,
	A22_TT01 float NULL,
	A22_PT01 float NULL,
	A22_FIT01 float NULL,
	A22_TT02 float NULL,
	A22_PT02 float NULL,
	A22_Internal_Humidity float NULL,
	A22_Internal_Temperature float NULL,
	A22_Potencia_Activa_Kw_lado_A float NULL,
	A22_Potencia_Activa_Kw_lado_B float NULL,
	A22_Energía_lado_A_Kwh int NULL,
	A22_Energía_lado_B_Kwh int NULL,
	A22_Energía_Contenedor_Kwh int NULL,
	A22_Vab_lado_A float NULL,
	A22_Vbc_lado_A float NULL,
	A22_Vac_lado_A float NULL,
	A22_Iab_lado_A int NULL,
	A22_Ibc_lado_A int NULL,
	A22_Iac_lado_A int NULL,
	A22_Iab_lado_B int NULL,
	A22_Ibc_lado_B int NULL,
	A22_Iac_lado_B int NULL,
	A22_Factor_de_Potencia_lado_A float NULL,
	A22_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE1933E8F2DEE5 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_A31 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_A31;
CREATE TABLE [Edge DB].dbo.Registros_A31 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	A31_Dew_Point_Temperature float NULL,
	A31_TT01 float NULL,
	A31_PT01 float NULL,
	A31_FIT01 float NULL,
	A31_TT02 float NULL,
	A31_PT02 float NULL,
	A31_Internal_Humidity float NULL,
	A31_Internal_Temperature float NULL,
	A31_Potencia_Activa_Kw_lado_A float NULL,
	A31_Potencia_Activa_Kw_lado_B float NULL,
	A31_Energía_lado_A_Kwh int NULL,
	A31_Energía_lado_B_Kwh int NULL,
	A31_Energía_Contenedor_Kwh int NULL,
	A31_Factor_de_Potencia_lado_A float NULL,
	A31_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE19331559D9A4 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_A32 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_A32;
CREATE TABLE [Edge DB].dbo.Registros_A32 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	A32_Dew_Point_Temperature float NULL,
	A32_TT01 float NULL,
	A32_PT01 float NULL,
	A32_FIT01 float NULL,
	A32_TT02 float NULL,
	A32_PT02 float NULL,
	A32_Internal_Humidity float NULL,
	A32_Internal_Temperature float NULL,
	A32_Potencia_Activa_Kw_lado_A float NULL,
	A32_Potencia_Activa_Kw_lado_B float NULL,
	A32_Energía_lado_A_Kwh int NULL,
	A32_Energía_lado_B_Kwh int NULL,
	A32_Energía_Contenedor_Kwh int NULL,
	A32_Factor_de_Potencia_lado_A float NULL,
	A32_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE1933DE2B6559 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_AL01 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_AL01;
CREATE TABLE [Edge DB].dbo.Registros_AL01 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	AL01_Total_Power float NULL,
	AL01_Energia float NULL,
	AL01_Corriente_IR float NULL,
	AL01_Corriente_IS float NULL,
	AL01_Corriente_IT float NULL,
	AL01_Voltaje_RS float NULL,
	AL01_Voltaje_ST float NULL,
	AL01_Voltaje_TR float NULL,
	AL01_FP float NULL,
	AL01_Frecuencia float NULL,
	CONSTRAINT PK__Registro__5ADE1933E9B66CC4 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_AL02 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_AL02;
CREATE TABLE [Edge DB].dbo.Registros_AL02 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	AL02_Total_Power float NULL,
	AL02_Energia float NULL,
	AL02_Corriente_IR float NULL,
	AL02_Corriente_IS float NULL,
	AL02_Corriente_IT float NULL,
	AL02_Voltaje_RS float NULL,
	AL02_Voltaje_ST float NULL,
	AL02_Voltaje_TR float NULL,
	AL02_FP float NULL,
	AL02_Frecuencia float NULL,
	CONSTRAINT PK__Registro__5ADE193302ACFBF2 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_AL03 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_AL03;
CREATE TABLE [Edge DB].dbo.Registros_AL03 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	AL03_Total_Power float NULL,
	AL03_Energia float NULL,
	AL03_Corriente_IR float NULL,
	AL03_Corriente_IS float NULL,
	AL03_Corriente_IT float NULL,
	AL03_Voltaje_RS float NULL,
	AL03_Voltaje_ST float NULL,
	AL03_Voltaje_TR float NULL,
	AL03_FP float NULL,
	AL03_Frecuencia float NULL,
	CONSTRAINT PK__Registro__5ADE1933CA126DCE PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_AL04 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_AL04;
CREATE TABLE [Edge DB].dbo.Registros_AL04 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	AL04_Total_Power float NULL,
	AL04_Energia float NULL,
	AL04_Corriente_IR float NULL,
	AL04_Corriente_IS float NULL,
	AL04_Corriente_IT float NULL,
	AL04_Voltaje_RS float NULL,
	AL04_Voltaje_ST float NULL,
	AL04_Voltaje_TR float NULL,
	AL04_FP float NULL,
	AL04_Frecuencia float NULL,
	CONSTRAINT PK__Registro__5ADE193359C356A3 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_AL05 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_AL05;
CREATE TABLE [Edge DB].dbo.Registros_AL05 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	AL05_Total_Power float NULL,
	AL05_Energia float NULL,
	AL05_Corriente_IR float NULL,
	AL05_Corriente_IS float NULL,
	AL05_Corriente_IT float NULL,
	AL05_Voltaje_RS float NULL,
	AL05_Voltaje_ST float NULL,
	AL05_Voltaje_TR float NULL,
	AL05_FP float NULL,
	AL05_Frecuencia float NULL,
	CONSTRAINT PK__Registro__5ADE1933C6EBC0B4 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_AL06 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_AL06;
CREATE TABLE [Edge DB].dbo.Registros_AL06 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	AL06_Total_Power float NULL,
	AL06_Energia float NULL,
	AL06_Corriente_IR float NULL,
	AL06_Corriente_IS float NULL,
	AL06_Corriente_IT float NULL,
	AL06_Voltaje_RS float NULL,
	AL06_Voltaje_ST float NULL,
	AL06_Voltaje_TR float NULL,
	AL06_FP float NULL,
	AL06_Frecuencia float NULL,
	CONSTRAINT PK__Registro__5ADE193357A08606 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_AL07 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_AL07;
CREATE TABLE [Edge DB].dbo.Registros_AL07 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	AL07_Total_Power float NULL,
	AL07_Energia float NULL,
	AL07_Corriente_IR float NULL,
	AL07_Corriente_IS float NULL,
	AL07_Corriente_IT float NULL,
	AL07_Voltaje_RS float NULL,
	AL07_Voltaje_ST float NULL,
	AL07_Voltaje_TR float NULL,
	AL07_FP float NULL,
	AL07_Frecuencia float NULL,
	CONSTRAINT PK__Registro__5ADE19333C97E1EB PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_AL08 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_AL08;
CREATE TABLE [Edge DB].dbo.Registros_AL08 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	AL08_Total_Power float NULL,
	AL08_Energia float NULL,
	AL08_Corriente_IR float NULL,
	AL08_Corriente_IS float NULL,
	AL08_Corriente_IT float NULL,
	AL08_Voltaje_RS float NULL,
	AL08_Voltaje_ST float NULL,
	AL08_Voltaje_TR float NULL,
	AL08_FP float NULL,
	AL08_Frecuencia float NULL,
	CONSTRAINT PK__Registro__5ADE193347A78449 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_AL09 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_AL09;
CREATE TABLE [Edge DB].dbo.Registros_AL09 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	AL09_Total_Power float NULL,
	AL09_Energia float NULL,
	AL09_Corriente_IR float NULL,
	AL09_Corriente_IS float NULL,
	AL09_Corriente_IT float NULL,
	AL09_Voltaje_RS float NULL,
	AL09_Voltaje_ST float NULL,
	AL09_Voltaje_TR float NULL,
	AL09_FP float NULL,
	AL09_Frecuencia float NULL,
	CONSTRAINT PK__Registro__5ADE1933E78DB1A1 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_AL10 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_AL10;
CREATE TABLE [Edge DB].dbo.Registros_AL10 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	AL10_Total_Power float NULL,
	AL10_Energia float NULL,
	AL10_Corriente_IR float NULL,
	AL10_Corriente_IS float NULL,
	AL10_Corriente_IT float NULL,
	AL10_Voltaje_RS float NULL,
	AL10_Voltaje_ST float NULL,
	AL10_Voltaje_TR float NULL,
	AL10_FP float NULL,
	AL10_Frecuencia float NULL,
	CONSTRAINT PK__Registro__5ADE19335E0AF2C3 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_AL11 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_AL11;
CREATE TABLE [Edge DB].dbo.Registros_AL11 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	AL11_Total_Power float NULL,
	AL11_Energia float NULL,
	AL11_Voltaje_RS int NULL,
	AL11_Voltaje_ST int NULL,
	AL11_Voltaje_TR int NULL,
	AL11_Corriente_IR int NULL,
	AL11_Corriente_IS int NULL,
	AL11_Corriente_IT int NULL,
	AL11_FP float NULL,
	AL11_Frecuencia int NULL,
	CONSTRAINT PK__Registro__5ADE1933FD76572C PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_AL12 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_AL12;
CREATE TABLE [Edge DB].dbo.Registros_AL12 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	AL12_Total_Power float NULL,
	AL12_Energia float NULL,
	AL12_Voltaje_RS int NULL,
	AL12_Voltaje_ST int NULL,
	AL12_Voltaje_TR int NULL,
	AL12_Corriente_IR int NULL,
	AL12_Corriente_IS int NULL,
	AL12_Corriente_IT int NULL,
	AL12_FP float NULL,
	AL12_Frecuencia int NULL,
	CONSTRAINT PK__Registro__5ADE19336801AB3B PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_AL13 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_AL13;
CREATE TABLE [Edge DB].dbo.Registros_AL13 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	AL13_Total_Power float NULL,
	AL13_Energia float NULL,
	AL13_Voltaje_RS int NULL,
	AL13_Voltaje_ST int NULL,
	AL13_Voltaje_TR int NULL,
	AL13_Corriente_IR int NULL,
	AL13_Corriente_IS int NULL,
	AL13_Corriente_IT int NULL,
	AL13_FP int NULL,
	AL13_Frecuencia int NULL,
	CONSTRAINT PK__Registro__5ADE19339A159FD7 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_AL14 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_AL14;
CREATE TABLE [Edge DB].dbo.Registros_AL14 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	AL14_Total_Power float NULL,
	AL14_Energia float NULL,
	AL14_Voltaje_RS int NULL,
	AL14_Voltaje_ST int NULL,
	AL14_Voltaje_TR int NULL,
	AL14_Corriente_IR int NULL,
	AL14_Corriente_IS int NULL,
	AL14_Corriente_IT int NULL,
	AL14_FP int NULL,
	AL14_Frecuencia int NULL,
	CONSTRAINT PK__Registro__5ADE1933386B479C PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_AL15 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_AL15;
CREATE TABLE [Edge DB].dbo.Registros_AL15 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	AL15_Total_Power float NULL,
	AL15_Energia float NULL,
	AL15_Voltaje_RS int NULL,
	AL15_Voltaje_ST int NULL,
	AL15_Voltaje_TR int NULL,
	AL15_Corriente_IR int NULL,
	AL15_Corriente_IS int NULL,
	AL15_Corriente_IT int NULL,
	AL15_FP int NULL,
	AL15_Frecuencia int NULL,
	CONSTRAINT PK__Registro__5ADE193321C2C3D3 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_B11 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_B11;
CREATE TABLE [Edge DB].dbo.Registros_B11 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	B11_Dew_Point_Temperature float NULL,
	B11_TT01 float NULL,
	B11_PT01 float NULL,
	B11_FIT01 float NULL,
	B11_TT02 float NULL,
	B11_PT02 float NULL,
	B11_Internal_Humidity float NULL,
	B11_Internal_Temperature float NULL,
	B11_Potencia_Activa_Kw_lado_A float NULL,
	B11_Potencia_Activa_Kw_lado_B float NULL,
	B11_Energía_lado_A_Kwh int NULL,
	B11_Energía_lado_B_Kwh int NULL,
	B11_Energía_Contenedor_Kwh int NULL,
	B11_Vab_lado_A float NULL,
	B11_Vbc_lado_A float NULL,
	B11_Vac_lado_A float NULL,
	B11_Iab_lado_A int NULL,
	B11_Ibc_lado_A int NULL,
	B11_Iac_lado_A int NULL,
	B11_Iab_lado_B int NULL,
	B11_Ibc_lado_B int NULL,
	B11_Iac_lado_B int NULL,
	B11_Factor_de_Potencia_lado_A float NULL,
	B11_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE19331A4FB62D PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_B12 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_B12;
CREATE TABLE [Edge DB].dbo.Registros_B12 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	B12_Dew_Point_Temperature float NULL,
	B12_TT01 float NULL,
	B12_PT01 float NULL,
	B12_FIT01 float NULL,
	B12_TT02 float NULL,
	B12_PT02 float NULL,
	B12_Internal_Humidity float NULL,
	B12_Internal_Temperature float NULL,
	B12_Potencia_Activa_Kw_lado_A float NULL,
	B12_Potencia_Activa_Kw_lado_B float NULL,
	B12_Energía_lado_A_Kwh int NULL,
	B12_Energía_lado_B_Kwh int NULL,
	B12_Energía_Contenedor_Kwh int NULL,
	B12_Vab_lado_A float NULL,
	B12_Vbc_lado_A float NULL,
	B12_Vac_lado_A float NULL,
	B12_Iab_lado_A int NULL,
	B12_Ibc_lado_A int NULL,
	B12_Iac_lado_A int NULL,
	B12_Iab_lado_B int NULL,
	B12_Ibc_lado_B int NULL,
	B12_Iac_lado_B int NULL,
	B12_Factor_de_Potencia_lado_A float NULL,
	B12_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE19332E4792D5 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_B21 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_B21;
CREATE TABLE [Edge DB].dbo.Registros_B21 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	B21_Dew_Point_Temperature float NULL,
	B21_TT01 float NULL,
	B21_PT01 float NULL,
	B21_FIT01 float NULL,
	B21_TT02 float NULL,
	B21_PT02 float NULL,
	B21_Internal_Humidity float NULL,
	B21_Internal_Temperature float NULL,
	B21_Potencia_Activa_Kw_lado_A float NULL,
	B21_Potencia_Activa_Kw_lado_B float NULL,
	B21_Energía_lado_A_Kwh int NULL,
	B21_Energía_lado_B_Kwh int NULL,
	B21_Energía_Contenedor_Kwh int NULL,
	B21_Vab_lado_A float NULL,
	B21_Vbc_lado_A float NULL,
	B21_Vac_lado_A float NULL,
	B21_Iab_lado_A int NULL,
	B21_Ibc_lado_A int NULL,
	B21_Iac_lado_A int NULL,
	B21_Iab_lado_B int NULL,
	B21_Ibc_lado_B int NULL,
	B21_Iac_lado_B int NULL,
	B21_Factor_de_Potencia_lado_A float NULL,
	B21_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE19339C7E1810 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_B22 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_B22;
CREATE TABLE [Edge DB].dbo.Registros_B22 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	B22_Dew_Point_Temperature float NULL,
	B22_TT01 float NULL,
	B22_PT01 float NULL,
	B22_FIT01 float NULL,
	B22_TT02 float NULL,
	B22_PT02 float NULL,
	B22_Internal_Humidity float NULL,
	B22_Internal_Temperature float NULL,
	B22_Potencia_Activa_Kw_lado_A float NULL,
	B22_Potencia_Activa_Kw_lado_B float NULL,
	B22_Energía_lado_A_Kwh int NULL,
	B22_Energía_lado_B_Kwh int NULL,
	B22_Energía_Contenedor_Kwh int NULL,
	B22_Vab_lado_A float NULL,
	B22_Vbc_lado_A float NULL,
	B22_Vac_lado_A float NULL,
	B22_Iab_lado_A int NULL,
	B22_Ibc_lado_A int NULL,
	B22_Iac_lado_A int NULL,
	B22_Iab_lado_B int NULL,
	B22_Ibc_lado_B int NULL,
	B22_Iac_lado_B int NULL,
	B22_Factor_de_Potencia_lado_A float NULL,
	B22_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE19337635F1CE PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_B31 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_B31;
CREATE TABLE [Edge DB].dbo.Registros_B31 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	B31_Dew_Point_Temperature float NULL,
	B31_TT01 float NULL,
	B31_PT01 float NULL,
	B31_FIT01 float NULL,
	B31_TT02 float NULL,
	B31_PT02 float NULL,
	B31_Internal_Humidity float NULL,
	B31_Internal_Temperature float NULL,
	B31_Potencia_Activa_Kw_lado_A float NULL,
	B31_Potencia_Activa_Kw_lado_B float NULL,
	B31_Energía_lado_A_Kwh int NULL,
	B31_Energía_lado_B_Kwh int NULL,
	B31_Energía_Contenedor_Kwh int NULL,
	B31_Factor_de_Potencia_lado_A float NULL,
	B31_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE1933979E24C9 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_B32 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_B32;
CREATE TABLE [Edge DB].dbo.Registros_B32 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	B32_Dew_Point_Temperature float NULL,
	B32_TT01 float NULL,
	B32_PT01 float NULL,
	B32_FIT01 float NULL,
	B32_TT02 float NULL,
	B32_PT02 float NULL,
	B32_Internal_Humidity float NULL,
	B32_Internal_Temperature float NULL,
	B32_Potencia_Activa_Kw_lado_A float NULL,
	B32_Potencia_Activa_Kw_lado_B float NULL,
	B32_Energía_lado_A_Kwh int NULL,
	B32_Energía_lado_B_Kwh int NULL,
	B32_Energía_Contenedor_Kwh int NULL,
	B32_Factor_de_Potencia_lado_A float NULL,
	B32_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE19332B9C3230 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_BC02 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_BC02;
CREATE TABLE [Edge DB].dbo.Registros_BC02 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	BC02_Total_Power float NULL,
	BC02_Energia float NULL,
	BC02_Corriente_IR float NULL,
	BC02_Corriente_IS float NULL,
	BC02_Corriente_IT float NULL,
	BC02_Voltaje_RS float NULL,
	BC02_Voltaje_ST float NULL,
	BC02_Voltaje_TR float NULL,
	BC02_FP float NULL,
	BC02_Frecuencia float NULL,
	CONSTRAINT PK__Registro__5ADE1933280F8CB0 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_C11 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_C11;
CREATE TABLE [Edge DB].dbo.Registros_C11 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	C11_Dew_Point_Temperature float NULL,
	C11_TT01 float NULL,
	C11_PT01 float NULL,
	C11_FIT01 float NULL,
	C11_TT02 float NULL,
	C11_PT02 float NULL,
	C11_Internal_Humidity float NULL,
	C11_Internal_Temperature float NULL,
	C11_Potencia_Activa_Kw_lado_A float NULL,
	C11_Potencia_Activa_Kw_lado_B float NULL,
	C11_Energía_lado_A_Kwh int NULL,
	C11_Energía_lado_B_Kwh int NULL,
	C11_Energía_Contenedor_Kwh int NULL,
	C11_Vab_lado_A float NULL,
	C11_Vbc_lado_A float NULL,
	C11_Vac_lado_A float NULL,
	C11_Iab_lado_A int NULL,
	C11_Ibc_lado_A int NULL,
	C11_Iac_lado_A int NULL,
	C11_Iab_lado_B int NULL,
	C11_Ibc_lado_B int NULL,
	C11_Iac_lado_B int NULL,
	C11_Factor_de_Potencia_lado_A float NULL,
	C11_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE193381E2A5D2 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_C12 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_C12;
CREATE TABLE [Edge DB].dbo.Registros_C12 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	C12_Dew_Point_Temperature float NULL,
	C12_TT01 float NULL,
	C12_PT01 float NULL,
	C12_FIT01 float NULL,
	C12_TT02 float NULL,
	C12_PT02 float NULL,
	C12_Internal_Humidity float NULL,
	C12_Internal_Temperature float NULL,
	C12_Potencia_Activa_Kw_lado_A float NULL,
	C12_Potencia_Activa_Kw_lado_B float NULL,
	C12_Energía_lado_A_Kwh int NULL,
	C12_Energía_lado_B_Kwh int NULL,
	C12_Energía_Contenedor_Kwh int NULL,
	C12_Vab_lado_A float NULL,
	C12_Vbc_lado_A float NULL,
	C12_Vac_lado_A float NULL,
	C12_Iab_lado_A int NULL,
	C12_Ibc_lado_A int NULL,
	C12_Iac_lado_A int NULL,
	C12_Iab_lado_B int NULL,
	C12_Ibc_lado_B int NULL,
	C12_Iac_lado_B int NULL,
	C12_Factor_de_Potencia_lado_A float NULL,
	C12_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE1933F8BABB38 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_C21 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_C21;
CREATE TABLE [Edge DB].dbo.Registros_C21 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	C21_Dew_Point_Temperature float NULL,
	C21_TT01 float NULL,
	C21_PT01 float NULL,
	C21_FIT01 float NULL,
	C21_TT02 float NULL,
	C21_PT02 float NULL,
	C21_Internal_Humidity float NULL,
	C21_Internal_Temperature float NULL,
	C21_Potencia_Activa_Kw_lado_A float NULL,
	C21_Potencia_Activa_Kw_lado_B float NULL,
	C21_Energía_lado_A_Kwh int NULL,
	C21_Energía_lado_B_Kwh int NULL,
	C21_Energía_Contenedor_Kwh int NULL,
	C21_Vab_lado_A float NULL,
	C21_Vbc_lado_A float NULL,
	C21_Vac_lado_A float NULL,
	C21_Iab_lado_A int NULL,
	C21_Ibc_lado_A int NULL,
	C21_Iac_lado_A int NULL,
	C21_Iab_lado_B int NULL,
	C21_Ibc_lado_B int NULL,
	C21_Iac_lado_B int NULL,
	C21_Factor_de_Potencia_lado_A float NULL,
	C21_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE1933B6B7FB7B PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_C22 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_C22;
CREATE TABLE [Edge DB].dbo.Registros_C22 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	C22_Dew_Point_Temperature float NULL,
	C22_TT01 float NULL,
	C22_PT01 float NULL,
	C22_FIT01 float NULL,
	C22_TT02 float NULL,
	C22_PT02 float NULL,
	C22_Internal_Humidity float NULL,
	C22_Internal_Temperature float NULL,
	C22_Potencia_Activa_Kw_lado_A float NULL,
	C22_Potencia_Activa_Kw_lado_B float NULL,
	C22_Energía_lado_A_Kwh int NULL,
	C22_Energía_lado_B_Kwh int NULL,
	C22_Energía_Contenedor_Kwh int NULL,
	C22_Vab_lado_A float NULL,
	C22_Vbc_lado_A float NULL,
	C22_Vac_lado_A float NULL,
	C22_Iab_lado_A int NULL,
	C22_Ibc_lado_A int NULL,
	C22_Iac_lado_A int NULL,
	C22_Iab_lado_B int NULL,
	C22_Ibc_lado_B int NULL,
	C22_Iac_lado_B int NULL,
	C22_Factor_de_Potencia_lado_A float NULL,
	C22_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE1933FE106DC1 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_C31 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_C31;
CREATE TABLE [Edge DB].dbo.Registros_C31 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	C31_Dew_Point_Temperature float NULL,
	C31_TT01 float NULL,
	C31_PT01 float NULL,
	C31_FIT01 float NULL,
	C31_TT02 float NULL,
	C31_PT02 float NULL,
	C31_Internal_Humidity float NULL,
	C31_Internal_Temperature float NULL,
	C31_Potencia_Activa_Kw_lado_A float NULL,
	C31_Potencia_Activa_Kw_lado_B float NULL,
	C31_Energía_lado_A_Kwh int NULL,
	C31_Energía_lado_B_Kwh int NULL,
	C31_Energía_Contenedor_Kwh int NULL,
	C31_Factor_de_Potencia_lado_A float NULL,
	C31_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE1933912B4541 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_C32 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_C32;
CREATE TABLE [Edge DB].dbo.Registros_C32 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	C32_Dew_Point_Temperature float NULL,
	C32_TT01 float NULL,
	C32_PT01 float NULL,
	C32_FIT01 float NULL,
	C32_TT02 float NULL,
	C32_PT02 float NULL,
	C32_Internal_Humidity float NULL,
	C32_Internal_Temperature float NULL,
	C32_Potencia_Activa_Kw_lado_A float NULL,
	C32_Potencia_Activa_Kw_lado_B float NULL,
	C32_Energía_lado_A_Kwh int NULL,
	C32_Energía_lado_B_Kwh int NULL,
	C32_Energía_Contenedor_Kwh int NULL,
	C32_Factor_de_Potencia_lado_A float NULL,
	C32_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE19336C7FC980 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_Caudalimetros definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_Caudalimetros;
CREATE TABLE [Edge DB].dbo.Registros_Caudalimetros (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	TB1_Caudal_Pozo_1 float NULL,
	TB1_Presion_bar_Pozo_1 float NULL,
	TB2_Caudal_Pozo_2 float NULL,
	TB2_Caudal_Pozo_3 float NULL,
	TB2_Caudal_Pozo_4 float NULL,
	TB2_Caudal_Pozo_Retorno float NULL,
	TB2_Caudal_Pozo_Sistema float NULL,
	TB2_Presion_bar_Tanque_Australiano float NULL,
	TB2_Presion_bar_Tanque_Copa_2 float NULL,
	T05_pressure_sensor float NULL,
	TB2_Caudal_AXXA float NULL,
	TBN_Caudal_Asp_SM float NULL,
	TBN_Caudal_Asp_ND float NULL,
	TBN_Caudal_Z float NULL,
	CONSTRAINT PK__Registro__5ADE19338E6988AB PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_Consumo_Agua definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_Consumo_Agua;
CREATE TABLE [Edge DB].dbo.Registros_Consumo_Agua (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	TB1_Totalizador_m3_Pozo_1 float NULL,
	TB2_Totalizador_m3_Pozo_2 float NULL,
	TB2_Totalizador_m3_Pozo_3 float NULL,
	TB2_Totalizador_m3_Pozo_4 float NULL,
	TB2_Totalizador_m3_Pozo_Retorno float NULL,
	TB2_Totalizador_m3_Pozo_Sistema float NULL,
	TB2_Totalizador_m3_AXXA float NULL,
	TBN_Totalizador_m3_Asp_SM float NULL,
	TV_Totalizador_m3_D31A float NULL,
	TV_Totalizador_m3_D31B float NULL,
	TV_Totalizador_m3_D32A float NULL,
	TV_Totalizador_m3_D32B float NULL,
	TBN_Totalizador_m3_Asp_ND float NULL,
	TV_Totalizador_m3_D22 float NULL,
	TBN_Totalizador_m3_Z float NULL,
	TB1_Presion_bar_Pozo_1 float NULL,
	TB2_Presion_bar_Tanque_Australiano float NULL,
	TB2_Presion_bar_Tanque_Copa_2 float NULL,
	T05_pressure_sensor float NULL,
	CONSTRAINT PK__Registro__5ADE1933B6A9E65B PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_D11 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_D11;
CREATE TABLE [Edge DB].dbo.Registros_D11 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	D11_Dew_Point_Temperature float NULL,
	D11_TT01 float NULL,
	D11_PT01 float NULL,
	D11_FIT01 float NULL,
	D11_TT02 float NULL,
	D11_PT02 float NULL,
	D11_Internal_Humidity float NULL,
	D11_Internal_Temperature float NULL,
	D11_Potencia_Activa_Kw_lado_A float NULL,
	D11_Potencia_Activa_Kw_lado_B float NULL,
	D11_Energía_lado_A_Kwh int NULL,
	D11_Energía_lado_B_Kwh int NULL,
	D11_Energía_Contenedor_Kwh int NULL,
	D11_Vab_lado_A float NULL,
	D11_Vbc_lado_A float NULL,
	D11_Vac_lado_A float NULL,
	D11_Iab_lado_A int NULL,
	D11_Ibc_lado_A int NULL,
	D11_Iac_lado_A int NULL,
	D11_Iab_lado_B int NULL,
	D11_Ibc_lado_B int NULL,
	D11_Iac_lado_B int NULL,
	D11_Factor_de_Potencia_lado_A float NULL,
	D11_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE193331A71263 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_D12 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_D12;
CREATE TABLE [Edge DB].dbo.Registros_D12 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	D12_Dew_Point_Temperature float NULL,
	D12_TT01 float NULL,
	D12_PT01 float NULL,
	D12_FIT01 float NULL,
	D12_TT02 float NULL,
	D12_PT02 float NULL,
	D12_Internal_Humidity float NULL,
	D12_Internal_Temperature float NULL,
	D12_Potencia_Activa_Kw_lado_A float NULL,
	D12_Potencia_Activa_Kw_lado_B float NULL,
	D12_Energía_lado_A_Kwh int NULL,
	D12_Energía_lado_B_Kwh int NULL,
	D12_Energía_Contenedor_Kwh int NULL,
	D12_Vab_lado_A float NULL,
	D12_Vbc_lado_A float NULL,
	D12_Vac_lado_A float NULL,
	D12_Iab_lado_A int NULL,
	D12_Ibc_lado_A int NULL,
	D12_Iac_lado_A int NULL,
	D12_Iab_lado_B int NULL,
	D12_Ibc_lado_B int NULL,
	D12_Iac_lado_B int NULL,
	D12_Factor_de_Potencia_lado_A float NULL,
	D12_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE193368C05960 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_D21 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_D21;
CREATE TABLE [Edge DB].dbo.Registros_D21 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	D21_Dew_Point_Temperature float NULL,
	D21_TT01 float NULL,
	D21_PT01 float NULL,
	D21_FIT01 float NULL,
	D21_TT02 float NULL,
	D21_PT02 float NULL,
	D21_Internal_Humidity float NULL,
	D21_Internal_Temperature float NULL,
	D21_Potencia_Activa_Kw_lado_A float NULL,
	D21_Potencia_Activa_Kw_lado_B float NULL,
	D21_Energía_lado_A_Kwh int NULL,
	D21_Energía_lado_B_Kwh int NULL,
	D21_Energía_Contenedor_Kwh int NULL,
	D21_Vab_lado_A float NULL,
	D21_Vbc_lado_A float NULL,
	D21_Vac_lado_A float NULL,
	D21_Iab_lado_A int NULL,
	D21_Ibc_lado_A int NULL,
	D21_Iac_lado_A int NULL,
	D21_Iab_lado_B int NULL,
	D21_Ibc_lado_B int NULL,
	D21_Iac_lado_B int NULL,
	D21_Factor_de_Potencia_lado_A float NULL,
	D21_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE193320B266EC PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_D22 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_D22;
CREATE TABLE [Edge DB].dbo.Registros_D22 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	D22_Current_A_lado_A float NULL,
	D22_Current_B_lado_A float NULL,
	D22_Current_C_lado_A float NULL,
	D22_Voltage_A_B_lado_A float NULL,
	D22_Voltage_B_C_lado_A float NULL,
	D22_Voltage_C_A_lado_A float NULL,
	D22_Active_Power_Total_lado_A float NULL,
	D22_Active_Energy_Delivered_Into_Load_lado_A float NULL,
	D22_Current_A_lado_B float NULL,
	D22_Current_B_lado_B float NULL,
	D22_Current_C_lado_B float NULL,
	D22_Active_Power_Total_lado_B float NULL,
	D22_Active_Energy_Delivered_Into_Load_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE1933612B06E7 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_D31 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_D31;
CREATE TABLE [Edge DB].dbo.Registros_D31 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	D31_Potencia_Activa_Kw_lado_A float NULL,
	D31_Potencia_Activa_Kw_lado_B float NULL,
	D31_Energía_lado_A_Kwh float NULL,
	D31_Energía_lado_B_Kwh float NULL,
	D31_TT01 float NULL,
	D31_TT02 float NULL,
	D31_PT01 float NULL,
	D31_PT02 float NULL,
	D31_FT01 float NULL,
	D31_TRT01 float NULL,
	D31_TH01 int NULL,
	D31_Dew_Point_Temp int NULL,
	D31_Vab_lado_A int NULL,
	D31_Vbc_lado_A int NULL,
	D31_Vac_lado_A int NULL,
	D31_Iab_lado_A float NULL,
	D31_Ibc_lado_A float NULL,
	D31_Iac_lado_A float NULL,
	D31_Iab_lado_B float NULL,
	D31_Ibc_lado_B float NULL,
	D31_Iac_lado_B float NULL,
	D31_Factor_de_Potencia_lado_A float NULL,
	D31_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE1933521301A6 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_D32 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_D32;
CREATE TABLE [Edge DB].dbo.Registros_D32 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	D32_Potencia_Activa_Kw_lado_A float NULL,
	D32_Potencia_Activa_Kw_lado_B float NULL,
	D32_Energía_lado_A_Kwh float NULL,
	D32_Energía_lado_B_Kwh float NULL,
	D32_TT01 float NULL,
	D32_TT02 float NULL,
	D32_PT01 float NULL,
	D32_PT02 float NULL,
	D32_FT01 float NULL,
	D32_TRT01 float NULL,
	D32_TH01 int NULL,
	D32_Dew_Point_Temp int NULL,
	D32_Vab_lado_A int NULL,
	D32_Vbc_lado_A int NULL,
	D32_Vac_lado_A int NULL,
	D32_Iab_lado_A float NULL,
	D32_Ibc_lado_A float NULL,
	D32_Iac_lado_A float NULL,
	D32_Iab_lado_B float NULL,
	D32_Ibc_lado_B float NULL,
	D32_Iac_lado_B float NULL,
	D32_Factor_de_Potencia_lado_A float NULL,
	D32_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE19331C15BA48 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_E11 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_E11;
CREATE TABLE [Edge DB].dbo.Registros_E11 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	E11_Total_system_power_Lado_A float NULL,
	E11_Total_kwh_Lado_A float NULL,
	E11_Total_system_power_Lado_B float NULL,
	E11_Total_kwh_Lado_B float NULL,
	E11_Phase_1_Line_to_Neutral_Volts_Lado_A float NULL,
	E11_Phase_2_Line_to_Neutral_Volts_Lado_A float NULL,
	E11_Phase_3_Line_to_Neutral_Volts_Lado_A float NULL,
	E11_Phase_1_Current_Lado_A float NULL,
	E11_Phase_2_Current_Lado_A float NULL,
	E11_Phase_3_Current_Lado_A float NULL,
	E11_Phase_1_Current_Lado_B float NULL,
	E11_Phase_2_Current_Lado_B float NULL,
	E11_Phase_3_Current_Lado_B float NULL,
	E11_Total_system_power_factor_Lado_A float NULL,
	E11_Total_system_power_factor_Lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE1933C6E868E5 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_E12 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_E12;
CREATE TABLE [Edge DB].dbo.Registros_E12 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	E12_Total_system_power_Lado_A float NULL,
	E12_Total_kwh_Lado_A float NULL,
	E12_Total_system_power_Lado_B float NULL,
	E12_Total_kwh_Lado_B float NULL,
	E12_Phase_1_Line_to_Neutral_Volts_Lado_A float NULL,
	E12_Phase_2_Line_to_Neutral_Volts_Lado_A float NULL,
	E12_Phase_3_Line_to_Neutral_Volts_Lado_A float NULL,
	E12_Phase_1_Current_Lado_A float NULL,
	E12_Phase_2_Current_Lado_A float NULL,
	E12_Phase_3_Current_Lado_A float NULL,
	E12_Phase_1_Current_Lado_B float NULL,
	E12_Phase_2_Current_Lado_B float NULL,
	E12_Phase_3_Current_Lado_B float NULL,
	E12_Total_system_power_factor_Lado_A float NULL,
	E12_Total_system_power_factor_Lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE193340DB4C6B PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_E21 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_E21;
CREATE TABLE [Edge DB].dbo.Registros_E21 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	E21_Total_system_power_Lado_A float NULL,
	E21_Total_kwh_Lado_A float NULL,
	E21_Total_system_power_Lado_B float NULL,
	E21_Total_kwh_Lado_B float NULL,
	E21_Phase_1_Line_to_Neutral_Volts_Lado_A float NULL,
	E21_Phase_2_Line_to_Neutral_Volts_Lado_A float NULL,
	E21_Phase_3_Line_to_Neutral_Volts_Lado_A float NULL,
	E21_Phase_1_Current_Lado_A float NULL,
	E21_Phase_2_Current_Lado_A float NULL,
	E21_Phase_3_Current_Lado_A float NULL,
	E21_Phase_1_Current_Lado_B float NULL,
	E21_Phase_2_Current_Lado_B float NULL,
	E21_Phase_3_Current_Lado_B float NULL,
	E21_Total_system_power_factor_Lado_A float NULL,
	E21_Total_system_power_factor_Lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE19331740792A PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_E22 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_E22;
CREATE TABLE [Edge DB].dbo.Registros_E22 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	E22_Total_system_power_Lado_A float NULL,
	E22_Total_kwh_Lado_A float NULL,
	E22_Total_system_power_Lado_B float NULL,
	E22_Total_kwh_Lado_B float NULL,
	E22_Phase_1_Line_to_Neutral_Volts_Lado_A float NULL,
	E22_Phase_2_Line_to_Neutral_Volts_Lado_A float NULL,
	E22_Phase_3_Line_to_Neutral_Volts_Lado_A float NULL,
	E22_Phase_1_Current_Lado_A float NULL,
	E22_Phase_2_Current_Lado_A float NULL,
	E22_Phase_3_Current_Lado_A float NULL,
	E22_Phase_1_Current_Lado_B float NULL,
	E22_Phase_2_Current_Lado_B float NULL,
	E22_Phase_3_Current_Lado_B float NULL,
	E22_Total_system_power_factor_Lado_A float NULL,
	E22_Total_system_power_factor_Lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE19334ED4592B PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_E31 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_E31;
CREATE TABLE [Edge DB].dbo.Registros_E31 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	E31_Total_system_power_Lado_A float NULL,
	E31_Total_kwh_Lado_A float NULL,
	E31_Total_system_power_Lado_B float NULL,
	E31_Total_kwh_Lado_B float NULL,
	E31_Phase_1_Line_to_Neutral_Volts_Lado_A float NULL,
	E31_Phase_2_Line_to_Neutral_Volts_Lado_A float NULL,
	E31_Phase_3_Line_to_Neutral_Volts_Lado_A float NULL,
	E31_Phase_1_Current_Lado_A float NULL,
	E31_Phase_2_Current_Lado_A float NULL,
	E31_Phase_3_Current_Lado_A float NULL,
	E31_Phase_1_Current_Lado_B float NULL,
	E31_Phase_2_Current_Lado_B float NULL,
	E31_Phase_3_Current_Lado_B float NULL,
	E31_Total_system_power_factor_Lado_A float NULL,
	E31_Total_system_power_factor_Lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE19336A8166B8 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_E32 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_E32;
CREATE TABLE [Edge DB].dbo.Registros_E32 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	E32_Total_system_power_Lado_A float NULL,
	E32_Total_kwh_Lado_A float NULL,
	E32_Total_system_power_Lado_B float NULL,
	E32_Total_kwh_Lado_B float NULL,
	E32_Phase_1_Line_to_Neutral_Volts_Lado_A float NULL,
	E32_Phase_2_Line_to_Neutral_Volts_Lado_A float NULL,
	E32_Phase_3_Line_to_Neutral_Volts_Lado_A float NULL,
	E32_Phase_1_Current_Lado_A float NULL,
	E32_Phase_2_Current_Lado_A float NULL,
	E32_Phase_3_Current_Lado_A float NULL,
	E32_Phase_1_Current_Lado_B float NULL,
	E32_Phase_2_Current_Lado_B float NULL,
	E32_Phase_3_Current_Lado_B float NULL,
	E32_Total_system_power_factor_Lado_A float NULL,
	E32_Total_system_power_factor_Lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE19334655DACE PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_EM01 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_EM01;
CREATE TABLE [Edge DB].dbo.Registros_EM01 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	EM01_Temperatura float NULL,
	EM01_Humedad float NULL,
	EM01_Presion float NULL,
	EM01_Velocidad_Viento float NULL,
	EM01_Direccion_Viento float NULL,
	EM01_Lluvia float NULL,
	CONSTRAINT PK__Registro__5ADE1933616B94BC PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_F11 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_F11;
CREATE TABLE [Edge DB].dbo.Registros_F11 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	F11_Potencia_Activa_Kw_lado_A float NULL,
	F11_Potencia_Activa_Kw_lado_B float NULL,
	F11_Energía_lado_A_Kwh float NULL,
	F11_Energía_lado_B_Kwh float NULL,
	F11_TT01 float NULL,
	F11_TT02 float NULL,
	F11_PT01 float NULL,
	F11_PT02 float NULL,
	F11_FT01 float NULL,
	F11_TRT01 float NULL,
	F11_TH01 int NULL,
	F11_Dew_Point_Temp int NULL,
	F11_Factor_de_Potencia_lado_A float NULL,
	F11_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE1933BFA7124D PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_F12 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_F12;
CREATE TABLE [Edge DB].dbo.Registros_F12 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	F12_Potencia_Activa_Kw_lado_A float NULL,
	F12_Potencia_Activa_Kw_lado_B float NULL,
	F12_Energía_lado_A_Kwh float NULL,
	F12_Energía_lado_B_Kwh float NULL,
	F12_TT01 float NULL,
	F12_TT02 float NULL,
	F12_PT01 float NULL,
	F12_PT02 float NULL,
	F12_FT01 float NULL,
	F12_TRT01 float NULL,
	F12_TH01 int NULL,
	F12_Dew_Point_Temp int NULL,
	F12_Factor_de_Potencia_lado_A float NULL,
	F12_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE1933A5DF1EB1 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_F21 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_F21;
CREATE TABLE [Edge DB].dbo.Registros_F21 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	F21_Potencia_Activa_Kw_lado_A float NULL,
	F21_Potencia_Activa_Kw_lado_B float NULL,
	F21_Energía_lado_A_Kwh float NULL,
	F21_Energía_lado_B_Kwh float NULL,
	F21_TT01 float NULL,
	F21_TT02 float NULL,
	F21_PT01 float NULL,
	F21_PT02 float NULL,
	F21_FT01 float NULL,
	F21_TRT01 float NULL,
	F21_TH01 int NULL,
	F21_Dew_Point_Temp int NULL,
	F21_Vab_lado_A int NULL,
	F21_Vbc_lado_A int NULL,
	F21_Vac_lado_A int NULL,
	F21_Iab_lado_A float NULL,
	F21_Ibc_lado_A float NULL,
	F21_Iac_lado_A float NULL,
	F21_Iab_lado_B float NULL,
	F21_Ibc_lado_B float NULL,
	F21_Iac_lado_B float NULL,
	F21_Factor_de_Potencia_lado_A float NULL,
	F21_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE193360C7F5D0 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_F22 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_F22;
CREATE TABLE [Edge DB].dbo.Registros_F22 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	F22_Potencia_Activa_Kw_lado_A float NULL,
	F22_Potencia_Activa_Kw_lado_B float NULL,
	F22_Energía_lado_A_Kwh float NULL,
	F22_Energía_lado_B_Kwh float NULL,
	F22_TT01 float NULL,
	F22_TT02 float NULL,
	F22_PT01 float NULL,
	F22_PT02 float NULL,
	F22_FT01 float NULL,
	F22_TRT01 float NULL,
	F22_TH01 int NULL,
	F22_Dew_Point_Temp int NULL,
	F22_Vab_lado_A int NULL,
	F22_Vbc_lado_A int NULL,
	F22_Vac_lado_A int NULL,
	F22_Iab_lado_A float NULL,
	F22_Ibc_lado_A float NULL,
	F22_Iac_lado_A float NULL,
	F22_Iab_lado_B float NULL,
	F22_Ibc_lado_B float NULL,
	F22_Iac_lado_B float NULL,
	F22_Factor_de_Potencia_lado_A float NULL,
	F22_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE19338E109B80 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_F31 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_F31;
CREATE TABLE [Edge DB].dbo.Registros_F31 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	F31_Potencia_Activa_Kw_lado_A float NULL,
	F31_Potencia_Activa_Kw_lado_B float NULL,
	F31_Energía_lado_A_Kwh float NULL,
	F31_Energía_lado_B_Kwh float NULL,
	F31_TT01 float NULL,
	F31_TT02 float NULL,
	F31_PT01 float NULL,
	F31_PT02 float NULL,
	F31_FT01 float NULL,
	F31_TRT01 float NULL,
	F31_TH01 int NULL,
	F31_Dew_Point_Temp int NULL,
	F31_Vab_lado_A int NULL,
	F31_Vbc_lado_A int NULL,
	F31_Vac_lado_A int NULL,
	F31_Iab_lado_A float NULL,
	F31_Ibc_lado_A float NULL,
	F31_Iac_lado_A float NULL,
	F31_Iab_lado_B float NULL,
	F31_Ibc_lado_B float NULL,
	F31_Iac_lado_B float NULL,
	F31_Factor_de_Potencia_lado_A float NULL,
	F31_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE1933B019DABD PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_F32 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_F32;
CREATE TABLE [Edge DB].dbo.Registros_F32 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	F32_Potencia_Activa_Kw_lado_A float NULL,
	F32_Potencia_Activa_Kw_lado_B float NULL,
	F32_Energía_lado_A_Kwh float NULL,
	F32_Energía_lado_B_Kwh float NULL,
	F32_TT01 float NULL,
	F32_TT02 float NULL,
	F32_PT01 float NULL,
	F32_PT02 float NULL,
	F32_FT01 float NULL,
	F32_TRT01 float NULL,
	F32_TH01 int NULL,
	F32_Dew_Point_Temp int NULL,
	F32_Vab_lado_A int NULL,
	F32_Vbc_lado_A int NULL,
	F32_Vac_lado_A int NULL,
	F32_Iab_lado_A float NULL,
	F32_Ibc_lado_A float NULL,
	F32_Iac_lado_A float NULL,
	F32_Iab_lado_B float NULL,
	F32_Ibc_lado_B float NULL,
	F32_Iac_lado_B float NULL,
	F32_Factor_de_Potencia_lado_A float NULL,
	F32_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE1933986BB911 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_G11 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_G11;
CREATE TABLE [Edge DB].dbo.Registros_G11 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	G11_Potencia_Activa_Kw_lado_A float NULL,
	G11_Potencia_Activa_Kw_lado_B float NULL,
	G11_Energía_lado_A_Kwh float NULL,
	G11_Energía_lado_B_Kwh float NULL,
	G11_TT01 float NULL,
	G11_TT02 float NULL,
	G11_PT01 float NULL,
	G11_PT02 float NULL,
	G11_FT01 float NULL,
	G11_TRT01 float NULL,
	G11_TH01 int NULL,
	G11_Dew_Point_Temp int NULL,
	G11_Vab_lado_A int NULL,
	G11_Vbc_lado_A int NULL,
	G11_Vac_lado_A int NULL,
	G11_Iab_lado_A float NULL,
	G11_Ibc_lado_A float NULL,
	G11_Iac_lado_A float NULL,
	G11_Iab_lado_B float NULL,
	G11_Ibc_lado_B float NULL,
	G11_Iac_lado_B float NULL,
	G11_Factor_de_Potencia_lado_A float NULL,
	G11_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE19334E045109 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_G12 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_G12;
CREATE TABLE [Edge DB].dbo.Registros_G12 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	G12_Potencia_Activa_Kw_lado_A float NULL,
	G12_Potencia_Activa_Kw_lado_B float NULL,
	G12_Energía_lado_A_Kwh float NULL,
	G12_Energía_lado_B_Kwh float NULL,
	G12_TT01 float NULL,
	G12_TT02 float NULL,
	G12_PT01 float NULL,
	G12_PT02 float NULL,
	G12_FT01 float NULL,
	G12_TRT01 float NULL,
	G12_TH01 int NULL,
	G12_Dew_Point_Temp int NULL,
	G12_Factor_de_Potencia_lado_A float NULL,
	G12_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE1933EE243E11 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_G21 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_G21;
CREATE TABLE [Edge DB].dbo.Registros_G21 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	G21_Potencia_Activa_Kw_lado_A float NULL,
	G21_Potencia_Activa_Kw_lado_B float NULL,
	G21_Energía_lado_A_Kwh float NULL,
	G21_Energía_lado_B_Kwh float NULL,
	G21_TT01 float NULL,
	G21_TT02 float NULL,
	G21_PT01 float NULL,
	G21_PT02 float NULL,
	G21_FT01 float NULL,
	G21_TRT01 float NULL,
	G21_TH01 int NULL,
	G21_Dew_Point_Temp int NULL,
	G21_Vab_lado_A int NULL,
	G21_Vbc_lado_A int NULL,
	G21_Vac_lado_A int NULL,
	G21_Iab_lado_A float NULL,
	G21_Ibc_lado_A float NULL,
	G21_Iac_lado_A float NULL,
	G21_Iab_lado_B float NULL,
	G21_Ibc_lado_B float NULL,
	G21_Iac_lado_B float NULL,
	G21_Factor_de_Potencia_lado_A float NULL,
	G21_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE193332A2DFFE PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_G22 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_G22;
CREATE TABLE [Edge DB].dbo.Registros_G22 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	G22_Potencia_Activa_Kw_lado_A float NULL,
	G22_Potencia_Activa_Kw_lado_B float NULL,
	G22_Energía_lado_A_Kwh float NULL,
	G22_Energía_lado_B_Kwh float NULL,
	G22_TT01 float NULL,
	G22_TT02 float NULL,
	G22_PT01 float NULL,
	G22_PT02 float NULL,
	G22_FT01 float NULL,
	G22_TRT01 float NULL,
	G22_TH01 int NULL,
	G22_Dew_Point_Temp int NULL,
	G22_Vab_lado_A int NULL,
	G22_Vbc_lado_A int NULL,
	G22_Vac_lado_A int NULL,
	G22_Iab_lado_A float NULL,
	G22_Ibc_lado_A float NULL,
	G22_Iac_lado_A float NULL,
	G22_Iab_lado_B float NULL,
	G22_Ibc_lado_B float NULL,
	G22_Iac_lado_B float NULL,
	G22_Factor_de_Potencia_lado_A float NULL,
	G22_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE19330014EEDE PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_M1 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_M1;
CREATE TABLE [Edge DB].dbo.Registros_M1 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M1_A_Voltaje_RS float NULL,
	M1_A_Voltaje_ST float NULL,
	M1_A_Voltaje_TR float NULL,
	M1_A_Corriente_IR float NULL,
	M1_A_Corriente_IS float NULL,
	M1_A_Corriente_IT float NULL,
	M1_A_Potencia_Activa_Kw float NULL,
	M1_A_Factor_de_Potencia float NULL,
	M1_A_Frecuencia float NULL,
	M1_A_Energia float NULL,
	M1_B_Voltaje_RS float NULL,
	M1_B_Voltaje_ST float NULL,
	M1_B_Voltaje_TR float NULL,
	M1_B_Corriente_IR float NULL,
	M1_B_Corriente_IS float NULL,
	M1_B_Corriente_IT float NULL,
	M1_B_Potencia_Activa_Kw float NULL,
	M1_B_Factor_de_Potencia float NULL,
	M1_B_Frecuencia float NULL,
	M1_B_Energia float NULL,
	CONSTRAINT PK__Registro__5ADE19336D9FCB39 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_M10 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_M10;
CREATE TABLE [Edge DB].dbo.Registros_M10 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M10_A_Voltaje_RS int NULL,
	M10_A_Voltaje_ST int NULL,
	M10_A_Voltaje_TR int NULL,
	M10_A_Corriente_IR int NULL,
	M10_A_Corriente_IS int NULL,
	M10_A_Corriente_IT int NULL,
	M10_A_Potencia_Activa_Kw int NULL,
	M10_A_Factor_de_Potencia int NULL,
	M10_A_Frecuencia int NULL,
	M10_A_Energia int NULL,
	M10_B_Voltaje_RS int NULL,
	M10_B_Voltaje_ST int NULL,
	M10_B_Voltaje_TR int NULL,
	M10_B_Corriente_IR int NULL,
	M10_B_Corriente_IS int NULL,
	M10_B_Corriente_IT int NULL,
	M10_B_Potencia_Activa_Kw int NULL,
	M10_B_Factor_de_Potencia int NULL,
	M10_B_Frecuencia int NULL,
	M10_B_Energia int NULL,
	CONSTRAINT PK__Registro__5ADE193388F87649 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_M11 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_M11;
CREATE TABLE [Edge DB].dbo.Registros_M11 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M11_A_Voltaje_RS float NULL,
	M11_A_Voltaje_ST float NULL,
	M11_A_Voltaje_TR float NULL,
	M11_A_Corriente_IR float NULL,
	M11_A_Corriente_IS float NULL,
	M11_A_Corriente_IT float NULL,
	M11_A_Potencia_Activa_Kw float NULL,
	M11_A_Factor_de_Potencia float NULL,
	M11_A_Frecuencia float NULL,
	M11_A_Energia float NULL,
	M11_B_Voltaje_RS float NULL,
	M11_B_Voltaje_ST float NULL,
	M11_B_Voltaje_TR float NULL,
	M11_B_Corriente_IR float NULL,
	M11_B_Corriente_IS float NULL,
	M11_B_Corriente_IT float NULL,
	M11_B_Potencia_Activa_Kw float NULL,
	M11_B_Factor_de_Potencia float NULL,
	M11_B_Frecuencia float NULL,
	M11_B_Energia float NULL,
	CONSTRAINT PK__Registro__5ADE193317244F73 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_M12 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_M12;
CREATE TABLE [Edge DB].dbo.Registros_M12 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M12_A_Voltaje_RS float NULL,
	M12_A_Voltaje_ST float NULL,
	M12_A_Voltaje_TR float NULL,
	M12_A_Corriente_IR float NULL,
	M12_A_Corriente_IS float NULL,
	M12_A_Corriente_IT float NULL,
	M12_A_Potencia_Activa_Kw float NULL,
	M12_A_Factor_de_Potencia float NULL,
	M12_A_Frecuencia float NULL,
	M12_A_Energia float NULL,
	M12_B_Voltaje_RS float NULL,
	M12_B_Voltaje_ST float NULL,
	M12_B_Voltaje_TR float NULL,
	M12_B_Corriente_IR float NULL,
	M12_B_Corriente_IS float NULL,
	M12_B_Corriente_IT float NULL,
	M12_B_Potencia_Activa_Kw float NULL,
	M12_B_Factor_de_Potencia float NULL,
	M12_B_Frecuencia float NULL,
	M12_B_Energia float NULL,
	CONSTRAINT PK__Registro__5ADE1933797F70BB PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_M13 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_M13;
CREATE TABLE [Edge DB].dbo.Registros_M13 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M13_A_Voltaje_RS float NULL,
	M13_A_Voltaje_ST float NULL,
	M13_A_Voltaje_TR float NULL,
	M13_A_Corriente_IR float NULL,
	M13_A_Corriente_IS float NULL,
	M13_A_Corriente_IT float NULL,
	M13_A_Potencia_Activa_Kw float NULL,
	M13_A_Factor_de_Potencia float NULL,
	M13_A_Frecuencia float NULL,
	M13_A_Energia float NULL,
	M13_B_Voltaje_RS float NULL,
	M13_B_Voltaje_ST float NULL,
	M13_B_Voltaje_TR float NULL,
	M13_B_Corriente_IR float NULL,
	M13_B_Corriente_IS float NULL,
	M13_B_Corriente_IT float NULL,
	M13_B_Potencia_Activa_Kw float NULL,
	M13_B_Factor_de_Potencia float NULL,
	M13_B_Frecuencia float NULL,
	M13_B_Energia float NULL,
	CONSTRAINT PK__Registro__5ADE1933BA191CF2 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_M14 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_M14;
CREATE TABLE [Edge DB].dbo.Registros_M14 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M14_A_Voltaje_RS float NULL,
	M14_A_Voltaje_ST float NULL,
	M14_A_Voltaje_TR float NULL,
	M14_A_Corriente_IR float NULL,
	M14_A_Corriente_IS float NULL,
	M14_A_Corriente_IT float NULL,
	M14_A_Potencia_Activa_Kw float NULL,
	M14_A_Factor_de_Potencia float NULL,
	M14_A_Frecuencia float NULL,
	M14_A_Energia float NULL,
	M14_B_Voltaje_RS float NULL,
	M14_B_Voltaje_ST float NULL,
	M14_B_Voltaje_TR float NULL,
	M14_B_Corriente_IR float NULL,
	M14_B_Corriente_IS float NULL,
	M14_B_Corriente_IT float NULL,
	M14_B_Potencia_Activa_Kw float NULL,
	M14_B_Factor_de_Potencia float NULL,
	M14_B_Frecuencia float NULL,
	M14_B_Energia float NULL,
	CONSTRAINT PK__Registro__5ADE1933921BADF7 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_M15 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_M15;
CREATE TABLE [Edge DB].dbo.Registros_M15 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M15_A_Voltaje_RS float NULL,
	M15_A_Voltaje_ST float NULL,
	M15_A_Voltaje_TR float NULL,
	M15_A_Corriente_IR float NULL,
	M15_A_Corriente_IS float NULL,
	M15_A_Corriente_IT float NULL,
	M15_A_Potencia_Activa_Kw float NULL,
	M15_A_Factor_de_Potencia float NULL,
	M15_A_Frecuencia float NULL,
	M15_A_Energia float NULL,
	M15_B_Voltaje_RS float NULL,
	M15_B_Voltaje_ST float NULL,
	M15_B_Voltaje_TR float NULL,
	M15_B_Corriente_IR float NULL,
	M15_B_Corriente_IS float NULL,
	M15_B_Corriente_IT float NULL,
	M15_B_Potencia_Activa_Kw float NULL,
	M15_B_Factor_de_Potencia float NULL,
	M15_B_Frecuencia float NULL,
	M15_B_Energia float NULL,
	CONSTRAINT PK__Registro__5ADE19333AB311E4 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_M16 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_M16;
CREATE TABLE [Edge DB].dbo.Registros_M16 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M16_A_Voltaje_RS int NULL,
	M16_A_Voltaje_ST int NULL,
	M16_A_Voltaje_TR int NULL,
	M16_A_Corriente_IR int NULL,
	M16_A_Corriente_IS int NULL,
	M16_A_Corriente_IT int NULL,
	M16_A_Potencia_Activa_Kw int NULL,
	M16_A_Factor_de_Potencia int NULL,
	M16_A_Frecuencia int NULL,
	M16_A_Energia int NULL,
	M16_B_Voltaje_RS int NULL,
	M16_B_Voltaje_ST int NULL,
	M16_B_Voltaje_TR int NULL,
	M16_B_Corriente_IR int NULL,
	M16_B_Corriente_IS int NULL,
	M16_B_Corriente_IT int NULL,
	M16_B_Potencia_Activa_Kw int NULL,
	M16_B_Factor_de_Potencia int NULL,
	M16_B_Frecuencia int NULL,
	M16_B_Energia int NULL,
	CONSTRAINT PK__Registro__5ADE1933B7874FEE PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_M17 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_M17;
CREATE TABLE [Edge DB].dbo.Registros_M17 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M17_A_Voltaje_RS int NULL,
	M17_A_Voltaje_ST int NULL,
	M17_A_Voltaje_TR int NULL,
	M17_A_Corriente_IR int NULL,
	M17_A_Corriente_IS int NULL,
	M17_A_Corriente_IT int NULL,
	M17_A_Potencia_Activa_Kw int NULL,
	M17_A_Factor_de_Potencia int NULL,
	M17_A_Frecuencia int NULL,
	M17_A_Energia int NULL,
	M17_B_Voltaje_RS int NULL,
	M17_B_Voltaje_ST int NULL,
	M17_B_Voltaje_TR int NULL,
	M17_B_Corriente_IR int NULL,
	M17_B_Corriente_IS int NULL,
	M17_B_Corriente_IT int NULL,
	M17_B_Potencia_Activa_Kw int NULL,
	M17_B_Factor_de_Potencia int NULL,
	M17_B_Frecuencia int NULL,
	M17_B_Energia int NULL,
	CONSTRAINT PK__Registro__5ADE19338BF4ACC0 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_M18 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_M18;
CREATE TABLE [Edge DB].dbo.Registros_M18 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M18_A_Voltaje_RS int NULL,
	M18_A_Voltaje_ST int NULL,
	M18_A_Voltaje_TR int NULL,
	M18_A_Corriente_IR int NULL,
	M18_A_Corriente_IS int NULL,
	M18_A_Corriente_IT int NULL,
	M18_A_Potencia_Activa_Kw int NULL,
	M18_A_Factor_de_Potencia int NULL,
	M18_A_Frecuencia int NULL,
	M18_A_Energia int NULL,
	M18_B_Voltaje_RS int NULL,
	M18_B_Voltaje_ST int NULL,
	M18_B_Voltaje_TR int NULL,
	M18_B_Corriente_IR int NULL,
	M18_B_Corriente_IS int NULL,
	M18_B_Corriente_IT int NULL,
	M18_B_Potencia_Activa_Kw int NULL,
	M18_B_Factor_de_Potencia int NULL,
	M18_B_Frecuencia int NULL,
	M18_B_Energia int NULL,
	CONSTRAINT PK__Registro__5ADE19330ED82ECC PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_M19 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_M19;
CREATE TABLE [Edge DB].dbo.Registros_M19 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M19_A_Voltaje_RS int NULL,
	M19_A_Voltaje_ST int NULL,
	M19_A_Voltaje_TR int NULL,
	M19_A_Corriente_IR int NULL,
	M19_A_Corriente_IS int NULL,
	M19_A_Corriente_IT int NULL,
	M19_A_Potencia_Activa_Kw int NULL,
	M19_A_Factor_de_Potencia int NULL,
	M19_A_Frecuencia int NULL,
	M19_A_Energia int NULL,
	M19_B_Voltaje_RS int NULL,
	M19_B_Voltaje_ST int NULL,
	M19_B_Voltaje_TR int NULL,
	M19_B_Corriente_IR int NULL,
	M19_B_Corriente_IS int NULL,
	M19_B_Corriente_IT int NULL,
	M19_B_Potencia_Activa_Kw int NULL,
	M19_B_Factor_de_Potencia int NULL,
	M19_B_Frecuencia int NULL,
	M19_B_Energia int NULL,
	CONSTRAINT PK__Registro__5ADE1933A24B2C2D PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_M2 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_M2;
CREATE TABLE [Edge DB].dbo.Registros_M2 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M2_A_Voltaje_RS float NULL,
	M2_A_Voltaje_ST float NULL,
	M2_A_Voltaje_TR float NULL,
	M2_A_Corriente_IR float NULL,
	M2_A_Corriente_IS float NULL,
	M2_A_Corriente_IT float NULL,
	M2_A_Potencia_Activa_Kw float NULL,
	M2_A_Factor_de_Potencia float NULL,
	M2_A_Frecuencia float NULL,
	M2_A_Energia float NULL,
	M2_B_Voltaje_RS float NULL,
	M2_B_Voltaje_ST float NULL,
	M2_B_Voltaje_TR float NULL,
	M2_B_Corriente_IR float NULL,
	M2_B_Corriente_IS float NULL,
	M2_B_Corriente_IT float NULL,
	M2_B_Potencia_Activa_Kw float NULL,
	M2_B_Factor_de_Potencia float NULL,
	M2_B_Frecuencia float NULL,
	M2_B_Energia float NULL,
	CONSTRAINT PK__Registro__5ADE19336F0E141A PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_M20 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_M20;
CREATE TABLE [Edge DB].dbo.Registros_M20 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M20_A_Voltaje_RS int NULL,
	M20_A_Voltaje_ST int NULL,
	M20_A_Voltaje_TR int NULL,
	M20_A_Corriente_IR int NULL,
	M20_A_Corriente_IS int NULL,
	M20_A_Corriente_IT int NULL,
	M20_A_Potencia_Activa_Kw int NULL,
	M20_A_Factor_de_Potencia int NULL,
	M20_A_Frecuencia int NULL,
	M20_A_Energia int NULL,
	M20_B_Voltaje_RS int NULL,
	M20_B_Voltaje_ST int NULL,
	M20_B_Voltaje_TR int NULL,
	M20_B_Corriente_IR int NULL,
	M20_B_Corriente_IS int NULL,
	M20_B_Corriente_IT int NULL,
	M20_B_Potencia_Activa_Kw int NULL,
	M20_B_Factor_de_Potencia int NULL,
	M20_B_Frecuencia int NULL,
	M20_B_Energia int NULL,
	CONSTRAINT PK__Registro__5ADE1933F24ACA40 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_M3 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_M3;
CREATE TABLE [Edge DB].dbo.Registros_M3 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M3_A_Voltaje_RS float NULL,
	M3_A_Voltaje_ST float NULL,
	M3_A_Voltaje_TR float NULL,
	M3_A_Corriente_IR float NULL,
	M3_A_Corriente_IS float NULL,
	M3_A_Corriente_IT float NULL,
	M3_A_Potencia_Activa_Kw float NULL,
	M3_A_Factor_de_Potencia float NULL,
	M3_A_Frecuencia float NULL,
	M3_A_Energia float NULL,
	M3_B_Voltaje_RS float NULL,
	M3_B_Voltaje_ST float NULL,
	M3_B_Voltaje_TR float NULL,
	M3_B_Corriente_IR float NULL,
	M3_B_Corriente_IS float NULL,
	M3_B_Corriente_IT float NULL,
	M3_B_Potencia_Activa_Kw float NULL,
	M3_B_Factor_de_Potencia float NULL,
	M3_B_Frecuencia float NULL,
	M3_B_Energia float NULL,
	CONSTRAINT PK__Registro__5ADE1933BCB480DC PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_M4 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_M4;
CREATE TABLE [Edge DB].dbo.Registros_M4 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M4_A_Voltaje_RS float NULL,
	M4_A_Voltaje_ST float NULL,
	M4_A_Voltaje_TR float NULL,
	M4_A_Corriente_IR float NULL,
	M4_A_Corriente_IS float NULL,
	M4_A_Corriente_IT float NULL,
	M4_A_Potencia_Activa_Kw float NULL,
	M4_A_Factor_de_Potencia float NULL,
	M4_A_Frecuencia float NULL,
	M4_A_Energia float NULL,
	M4_B_Voltaje_RS float NULL,
	M4_B_Voltaje_ST float NULL,
	M4_B_Voltaje_TR float NULL,
	M4_B_Corriente_IR float NULL,
	M4_B_Corriente_IS float NULL,
	M4_B_Corriente_IT float NULL,
	M4_B_Potencia_Activa_Kw float NULL,
	M4_B_Factor_de_Potencia float NULL,
	M4_B_Frecuencia float NULL,
	M4_B_Energia float NULL,
	CONSTRAINT PK__Registro__5ADE19334DEB0D96 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_M5 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_M5;
CREATE TABLE [Edge DB].dbo.Registros_M5 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M5_A_Voltaje_RS float NULL,
	M5_A_Voltaje_ST float NULL,
	M5_A_Voltaje_TR float NULL,
	M5_A_Corriente_IR float NULL,
	M5_A_Corriente_IS float NULL,
	M5_A_Corriente_IT float NULL,
	M5_A_Potencia_Activa_Kw float NULL,
	M5_A_Factor_de_Potencia float NULL,
	M5_A_Frecuencia float NULL,
	M5_A_Energia float NULL,
	M5_B_Voltaje_RS float NULL,
	M5_B_Voltaje_ST float NULL,
	M5_B_Voltaje_TR float NULL,
	M5_B_Corriente_IR float NULL,
	M5_B_Corriente_IS float NULL,
	M5_B_Corriente_IT float NULL,
	M5_B_Potencia_Activa_Kw float NULL,
	M5_B_Factor_de_Potencia float NULL,
	M5_B_Frecuencia float NULL,
	M5_B_Energia float NULL,
	CONSTRAINT PK__Registro__5ADE19333ABDE43F PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_M6 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_M6;
CREATE TABLE [Edge DB].dbo.Registros_M6 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M6_A_Voltaje_RS int NULL,
	M6_A_Voltaje_ST int NULL,
	M6_A_Voltaje_TR int NULL,
	M6_A_Corriente_IR int NULL,
	M6_A_Corriente_IS int NULL,
	M6_A_Corriente_IT int NULL,
	M6_A_Potencia_Activa_Kw int NULL,
	M6_A_Factor_de_Potencia int NULL,
	M6_A_Frecuencia int NULL,
	M6_A_Energia int NULL,
	M6_B_Voltaje_RS int NULL,
	M6_B_Voltaje_ST int NULL,
	M6_B_Voltaje_TR int NULL,
	M6_B_Corriente_IR int NULL,
	M6_B_Corriente_IS int NULL,
	M6_B_Corriente_IT int NULL,
	M6_B_Potencia_Activa_Kw int NULL,
	M6_B_Factor_de_Potencia int NULL,
	M6_B_Frecuencia int NULL,
	M6_B_Energia int NULL,
	CONSTRAINT PK__Registro__5ADE193352E08A86 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_M7 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_M7;
CREATE TABLE [Edge DB].dbo.Registros_M7 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M7_A_Voltaje_RS int NULL,
	M7_A_Voltaje_ST int NULL,
	M7_A_Voltaje_TR int NULL,
	M7_A_Corriente_IR int NULL,
	M7_A_Corriente_IS int NULL,
	M7_A_Corriente_IT int NULL,
	M7_A_Potencia_Activa_Kw int NULL,
	M7_A_Factor_de_Potencia int NULL,
	M7_A_Frecuencia int NULL,
	M7_A_Energia int NULL,
	M7_B_Voltaje_RS int NULL,
	M7_B_Voltaje_ST int NULL,
	M7_B_Voltaje_TR int NULL,
	M7_B_Corriente_IR int NULL,
	M7_B_Corriente_IS int NULL,
	M7_B_Corriente_IT int NULL,
	M7_B_Potencia_Activa_Kw int NULL,
	M7_B_Factor_de_Potencia int NULL,
	M7_B_Frecuencia int NULL,
	M7_B_Energia int NULL,
	CONSTRAINT PK__Registro__5ADE19335BD59106 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_M8 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_M8;
CREATE TABLE [Edge DB].dbo.Registros_M8 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M8_A_Voltaje_RS int NULL,
	M8_A_Voltaje_ST int NULL,
	M8_A_Voltaje_TR int NULL,
	M8_A_Corriente_IR int NULL,
	M8_A_Corriente_IS int NULL,
	M8_A_Corriente_IT int NULL,
	M8_A_Potencia_Activa_Kw int NULL,
	M8_A_Factor_de_Potencia int NULL,
	M8_A_Frecuencia int NULL,
	M8_A_Energia int NULL,
	M8_B_Voltaje_RS int NULL,
	M8_B_Voltaje_ST int NULL,
	M8_B_Voltaje_TR int NULL,
	M8_B_Corriente_IR int NULL,
	M8_B_Corriente_IS int NULL,
	M8_B_Corriente_IT int NULL,
	M8_B_Potencia_Activa_Kw int NULL,
	M8_B_Factor_de_Potencia int NULL,
	M8_B_Frecuencia int NULL,
	M8_B_Energia int NULL,
	CONSTRAINT PK__Registro__5ADE19339C3C2157 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_M9 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_M9;
CREATE TABLE [Edge DB].dbo.Registros_M9 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M9_A_Voltaje_RS int NULL,
	M9_A_Voltaje_ST int NULL,
	M9_A_Voltaje_TR int NULL,
	M9_A_Corriente_IR int NULL,
	M9_A_Corriente_IS int NULL,
	M9_A_Corriente_IT int NULL,
	M9_A_Potencia_Activa_Kw int NULL,
	M9_A_Factor_de_Potencia int NULL,
	M9_A_Frecuencia int NULL,
	M9_A_Energia int NULL,
	M9_B_Voltaje_RS int NULL,
	M9_B_Voltaje_ST int NULL,
	M9_B_Voltaje_TR int NULL,
	M9_B_Corriente_IR int NULL,
	M9_B_Corriente_IS int NULL,
	M9_B_Corriente_IT int NULL,
	M9_B_Potencia_Activa_Kw int NULL,
	M9_B_Factor_de_Potencia int NULL,
	M9_B_Frecuencia int NULL,
	M9_B_Energia int NULL,
	CONSTRAINT PK__Registro__5ADE1933E7F050DF PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_N1 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_N1;
CREATE TABLE [Edge DB].dbo.Registros_N1 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N1_Current_A_lado_A float NULL,
	N1_Current_Blado_A float NULL,
	N1_Current_C_lado_A float NULL,
	N1_Voltage_A_B_lado_A float NULL,
	N1_Voltage_B_C_lado_A float NULL,
	N1_Voltage_C_A_lado_A float NULL,
	N1_Active_Power_Total_lado_A float NULL,
	N1_Active_Energy_Received_Out_of_Load_lado_A float NULL,
	N1_Current_A_Lado_B float NULL,
	N1_Current_BLado_B float NULL,
	N1_Current_C_Lado_B float NULL,
	N1_Active_Power_Total_Lado_B float NULL,
	N1_Active_Energy_Received_Out_of_Load_Lado_B float NULL,
	N1_Power_Factor_lado_A float NULL,
	N1_Power_Factor_Lado_B float NULL,
	N1_Temperature_In float NULL,
	N1_Temperature_Out float NULL,
	N1_Flow float NULL,
	N1_Pump_Frecuency float NULL,
	N1_Pump_Velocity float NULL,
	N1_Pressure float NULL,
	N1_R1_T1 float NULL,
	N1_R1_H1 float NULL,
	N1_R1_T2 float NULL,
	N1_R1_H2 float NULL,
	N1_R6_T1 float NULL,
	N1_R6_H1 float NULL,
	N1_R6_T2 float NULL,
	N1_R6_H2 float NULL,
	N1_R11_T1 float NULL,
	N1_R11_H1 float NULL,
	N1_R11_T2 float NULL,
	N1_R11_H2 float NULL,
	N1_T1_Prom float NULL,
	N1_T2_Prom float NULL,
	CONSTRAINT PK__Registro__5ADE1933DFF3FA46 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_N10 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_N10;
CREATE TABLE [Edge DB].dbo.Registros_N10 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N10_Current_A_lado_A float NULL,
	N10_Current_Blado_A float NULL,
	N10_Current_C_lado_A float NULL,
	N10_Voltage_A_B_lado_A float NULL,
	N10_Voltage_B_C_lado_A float NULL,
	N10_Voltage_C_A_lado_A float NULL,
	N10_Active_Power_Total_lado_A float NULL,
	N10_Active_Energy_Received_Out_of_Load_lado_A float NULL,
	N10_Current_A_Lado_B float NULL,
	N10_Current_BLado_B float NULL,
	N10_Current_C_Lado_B float NULL,
	N10_Active_Power_Total_Lado_B float NULL,
	N10_Active_Energy_Received_Out_of_Load_Lado_B float NULL,
	N10_Power_Factor_lado_A float NULL,
	N10_Power_Factor_Lado_B float NULL,
	N10_Temperature_In float NULL,
	N10_Temperature_Out float NULL,
	N10_Pressure float NULL,
	N10_Flow float NULL,
	N10_Pump_Frecuency float NULL,
	N10_Pump_Velocity float NULL,
	N10_R1_T1 float NULL,
	N10_R1_H1 float NULL,
	N10_R1_T2 float NULL,
	N10_R1_H2 float NULL,
	N10_R6_T1 float NULL,
	N10_R6_H1 float NULL,
	N10_R6_T2 float NULL,
	N10_R6_H2 float NULL,
	N10_R11_T1 float NULL,
	N10_R11_H1 float NULL,
	N10_R11_T2 float NULL,
	N10_R11_H2 float NULL,
	N10_T1_Prom float NULL,
	N10_T2_Prom float NULL,
	CONSTRAINT PK__Registro__5ADE1933520B366B PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_N11 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_N11;
CREATE TABLE [Edge DB].dbo.Registros_N11 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N11_Current_A_lado_A float NULL,
	N11_Current_Blado_A float NULL,
	N11_Current_C_lado_A float NULL,
	N11_Voltage_A_B_lado_A float NULL,
	N11_Voltage_B_C_lado_A float NULL,
	N11_Voltage_C_A_lado_A float NULL,
	N11_Active_Power_Total_lado_A float NULL,
	N11_Active_Energy_Received_Out_of_Load_lado_A float NULL,
	N11_Current_A_Lado_B float NULL,
	N11_Current_BLado_B float NULL,
	N11_Current_C_Lado_B float NULL,
	N11_Active_Power_Total_Lado_B float NULL,
	N11_Active_Energy_Received_Out_of_Load_Lado_B float NULL,
	N11_Power_Factor_lado_A float NULL,
	N11_Power_Factor_Lado_B float NULL,
	N11_Temperature_In float NULL,
	N11_Temperature_Out float NULL,
	N11_Flow float NULL,
	N11_Pump_Frecuency float NULL,
	N11_Pump_Velocity float NULL,
	N11_Pressure float NULL,
	N11_R1_T1 float NULL,
	N11_R1_H1 float NULL,
	N11_R1_T2 float NULL,
	N11_R1_H2 float NULL,
	N11_R6_T1 float NULL,
	N11_R6_H1 float NULL,
	N11_R6_T2 float NULL,
	N11_R6_H2 float NULL,
	N11_R11_T1 float NULL,
	N11_R11_H1 float NULL,
	N11_R11_T2 float NULL,
	N11_R11_H2 float NULL,
	N11_T1_Prom float NULL,
	N11_T2_Prom float NULL,
	CONSTRAINT PK__Registro__5ADE1933C48435D8 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_N12 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_N12;
CREATE TABLE [Edge DB].dbo.Registros_N12 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N12_Current_A_lado_A float NULL,
	N12_Current_Blado_A float NULL,
	N12_Current_C_lado_A float NULL,
	N12_Voltage_A_B_lado_A float NULL,
	N12_Voltage_B_C_lado_A float NULL,
	N12_Voltage_C_A_lado_A float NULL,
	N12_Active_Power_Total_lado_A float NULL,
	N12_Active_Energy_Received_Out_of_Load_lado_A float NULL,
	N12_Current_A_Lado_B float NULL,
	N12_Current_BLado_B float NULL,
	N12_Current_C_Lado_B float NULL,
	N12_Active_Power_Total_Lado_B float NULL,
	N12_Active_Energy_Received_Out_of_Load_Lado_B float NULL,
	N12_Power_Factor_lado_A float NULL,
	N12_Power_Factor_Lado_B float NULL,
	N12_Temperature_In float NULL,
	N12_Temperature_Out float NULL,
	N12_Pressure float NULL,
	N12_Flow float NULL,
	N12_Pump_Frecuency float NULL,
	N12_Pump_Velocity float NULL,
	N12_R1_T1 float NULL,
	N12_R1_H1 float NULL,
	N12_R1_T2 float NULL,
	N12_R1_H2 float NULL,
	N12_R6_T1 float NULL,
	N12_R6_H1 float NULL,
	N12_R6_T2 float NULL,
	N12_R6_H2 float NULL,
	N12_R11_T1 float NULL,
	N12_R11_H1 float NULL,
	N12_R11_T2 float NULL,
	N12_R11_H2 float NULL,
	N12_T1_Prom float NULL,
	N12_T2_Prom float NULL,
	CONSTRAINT PK__Registro__5ADE1933FF76D87F PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_N2 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_N2;
CREATE TABLE [Edge DB].dbo.Registros_N2 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N2_Current_A_lado_A float NULL,
	N2_Current_Blado_A float NULL,
	N2_Voltage_A_B_lado_A float NULL,
	N2_Voltage_B_C_lado_A float NULL,
	N2_Voltage_C_A_lado_A float NULL,
	N2_Active_Power_Total_lado_A float NULL,
	N2_Active_Energy_Received_Out_of_Load_lado_A float NULL,
	N2_Current_A_Lado_B float NULL,
	N2_Current_BLado_B float NULL,
	N2_Current_C_Lado_B float NULL,
	N2_Active_Power_Total_Lado_B float NULL,
	N2_Active_Energy_Received_Out_of_Load_Lado_B float NULL,
	N2_Current_C_lado_A float NULL,
	N2_Power_Factor_lado_A float NULL,
	N2_Power_Factor_Lado_B float NULL,
	N2_Temperature_In float NULL,
	N2_Temperature_Out float NULL,
	N2_Pressure float NULL,
	N2_Flow float NULL,
	N2_Pump_Frecuency float NULL,
	N2_Pump_Velocity float NULL,
	N2_R1_T1 float NULL,
	N2_R1_H1 float NULL,
	N2_R1_T2 float NULL,
	N2_R1_H2 float NULL,
	N2_R6_T1 float NULL,
	N2_R6_H1 float NULL,
	N2_R6_T2 float NULL,
	N2_R6_H2 float NULL,
	N2_R11_T1 float NULL,
	N2_R11_H1 float NULL,
	N2_R11_T2 float NULL,
	N2_R11_H2 float NULL,
	N2_T1_Prom float NULL,
	N2_T2_Prom float NULL,
	CONSTRAINT PK__Registro__5ADE1933FAD83EEC PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_N3 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_N3;
CREATE TABLE [Edge DB].dbo.Registros_N3 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N3_Current_A_lado_A float NULL,
	N3_Current_Blado_A float NULL,
	N3_Current_C_lado_A float NULL,
	N3_Voltage_A_B_lado_A float NULL,
	N3_Voltage_B_C_lado_A float NULL,
	N3_Voltage_C_A_lado_A float NULL,
	N3_Active_Power_Total_lado_A float NULL,
	N3_Active_Energy_Received_Out_of_Load_lado_A float NULL,
	N3_Current_A_Lado_B float NULL,
	N3_Current_BLado_B float NULL,
	N3_Current_C_Lado_B float NULL,
	N3_Active_Power_Total_Lado_B float NULL,
	N3_Active_Energy_Received_Out_of_Load_Lado_B float NULL,
	N3_Power_Factor_lado_A float NULL,
	N3_Power_Factor_Lado_B float NULL,
	N3_Temperature_In float NULL,
	N3_Temperature_Out float NULL,
	N3_Pressure float NULL,
	N3_Flow float NULL,
	N3_Pump_Frecuency float NULL,
	N3_Pump_Velocity float NULL,
	N3_R1_T1 float NULL,
	N3_R1_H1 float NULL,
	N3_R1_T2 float NULL,
	N3_R1_H2 float NULL,
	N3_R6_T1 float NULL,
	N3_R6_H1 float NULL,
	N3_R6_T2 float NULL,
	N3_R6_H2 float NULL,
	N3_R11_T1 float NULL,
	N3_R11_H1 float NULL,
	N3_R11_T2 float NULL,
	N3_R11_H2 float NULL,
	N3_T1_Prom float NULL,
	N3_T2_Prom float NULL,
	CONSTRAINT PK__Registro__5ADE19337609CD89 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_N4 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_N4;
CREATE TABLE [Edge DB].dbo.Registros_N4 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N4_Current_A_lado_A float NULL,
	N4_Current_Blado_A float NULL,
	N4_Current_C_lado_A float NULL,
	N4_Voltage_A_B_lado_A float NULL,
	N4_Voltage_B_C_lado_A float NULL,
	N4_Voltage_C_A_lado_A float NULL,
	N4_Active_Power_Total_lado_A float NULL,
	N4_Active_Energy_Received_Out_of_Load_lado_A float NULL,
	N4_Current_A_Lado_B float NULL,
	N4_Current_BLado_B float NULL,
	N4_Current_C_Lado_B float NULL,
	N4_Active_Power_Total_Lado_B float NULL,
	N4_Active_Energy_Received_Out_of_Load_Lado_B float NULL,
	N4_Power_Factor_lado_A float NULL,
	N4_Power_Factor_Lado_B float NULL,
	N4_Temperature_In float NULL,
	N4_Temperature_Out float NULL,
	N4_Pressure float NULL,
	N4_Flow float NULL,
	N4_Pump_Frecuency float NULL,
	N4_Pump_Velocity float NULL,
	N4_R1_T1 float NULL,
	N4_R1_H1 float NULL,
	N4_R1_T2 float NULL,
	N4_R1_H2 float NULL,
	N4_R6_T1 float NULL,
	N4_R6_H1 float NULL,
	N4_R6_T2 float NULL,
	N4_R6_H2 float NULL,
	N4_R11_T1 float NULL,
	N4_R11_H1 float NULL,
	N4_R11_T2 float NULL,
	N4_R11_H2 float NULL,
	N4_T1_Prom float NULL,
	N4_T2_Prom float NULL,
	CONSTRAINT PK__Registro__5ADE193330F0C14C PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_N5 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_N5;
CREATE TABLE [Edge DB].dbo.Registros_N5 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N5_Current_A_lado_A float NULL,
	N5_Current_Blado_A float NULL,
	N5_Current_C_lado_A float NULL,
	N5_Voltage_A_B_lado_A float NULL,
	N5_Voltage_B_C_lado_A float NULL,
	N5_Voltage_C_A_lado_A float NULL,
	N5_Active_Power_Total_lado_A float NULL,
	N5_Active_Energy_Received_Out_of_Load_lado_A float NULL,
	N5_Current_A_Lado_B float NULL,
	N5_Current_BLado_B float NULL,
	N5_Current_C_Lado_B float NULL,
	N5_Active_Power_Total_Lado_B float NULL,
	N5_Active_Energy_Received_Out_of_Load_Lado_B float NULL,
	N5_Power_Factor_lado_A float NULL,
	N5_Power_Factor_Lado_B float NULL,
	N5_Pressure float NULL,
	N5_Flow float NULL,
	N5_Pump_Frecuency float NULL,
	N5_Temperature_In float NULL,
	N5_Temperature_Out float NULL,
	N5_Pump_Velocity float NULL,
	N5_R1_T1 float NULL,
	N5_R1_H1 float NULL,
	N5_R1_T2 float NULL,
	N5_R1_H2 float NULL,
	N5_R6_T1 float NULL,
	N5_R6_H1 float NULL,
	N5_R6_T2 float NULL,
	N5_R6_H2 float NULL,
	N5_R11_T1 float NULL,
	N5_R11_H1 float NULL,
	N5_R11_T2 float NULL,
	N5_R11_H2 float NULL,
	N5_T1_Prom float NULL,
	N5_T2_Prom float NULL,
	CONSTRAINT PK__Registro__5ADE193330F599CC PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_N6 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_N6;
CREATE TABLE [Edge DB].dbo.Registros_N6 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N6_Current_A_lado_A float NULL,
	N6_Current_Blado_A float NULL,
	N6_Current_C_lado_A float NULL,
	N6_Voltage_A_B_lado_A float NULL,
	N6_Voltage_B_C_lado_A float NULL,
	N6_Voltage_C_A_lado_A float NULL,
	N6_Active_Power_Total_lado_A float NULL,
	N6_Active_Energy_Received_Out_of_Load_lado_A float NULL,
	N6_Current_A_Lado_B float NULL,
	N6_Current_BLado_B float NULL,
	N6_Current_C_Lado_B float NULL,
	N6_Active_Power_Total_Lado_B float NULL,
	N6_Active_Energy_Received_Out_of_Load_Lado_B float NULL,
	N6_Power_Factor_lado_A float NULL,
	N6_Power_Factor_Lado_B float NULL,
	N6_Temperature_In float NULL,
	N6_Temperature_Out float NULL,
	N6_Pressure float NULL,
	N6_Flow float NULL,
	N6_Pump_Frecuency float NULL,
	N6_Pump_Velocity float NULL,
	N6_R1_T1 float NULL,
	N6_R1_H1 float NULL,
	N6_R1_T2 float NULL,
	N6_R1_H2 float NULL,
	N6_R6_T1 float NULL,
	N6_R6_H1 float NULL,
	N6_R6_T2 float NULL,
	N6_R6_H2 float NULL,
	N6_R11_T1 float NULL,
	N6_R11_H1 float NULL,
	N6_R11_T2 float NULL,
	N6_R11_H2 float NULL,
	N6_T1_Prom float NULL,
	N6_T2_Prom float NULL,
	CONSTRAINT PK__Registro__5ADE1933223E4E12 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_N7 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_N7;
CREATE TABLE [Edge DB].dbo.Registros_N7 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N7_Current_A_lado_A float NULL,
	N7_Current_Blado_A float NULL,
	N7_Current_C_lado_A float NULL,
	N7_Voltage_A_B_lado_A float NULL,
	N7_Voltage_B_C_lado_A float NULL,
	N7_Voltage_C_A_lado_A float NULL,
	N7_Active_Power_Total_lado_A float NULL,
	N7_Active_Energy_Received_Out_of_Load_lado_A float NULL,
	N7_Current_A_Lado_B float NULL,
	N7_Current_BLado_B float NULL,
	N7_Current_C_Lado_B float NULL,
	N7_Active_Power_Total_Lado_B float NULL,
	N7_Active_Energy_Received_Out_of_Load_Lado_B float NULL,
	N7_Power_Factor_lado_A float NULL,
	N7_Power_Factor_Lado_B float NULL,
	N7_Temperature_In float NULL,
	N7_Temperature_Out float NULL,
	N7_Flow float NULL,
	N7_Pump_Frecuency float NULL,
	N7_Pump_Velocity float NULL,
	N7_R1_T1 float NULL,
	N7_R1_H1 float NULL,
	N7_R1_T2 float NULL,
	N7_R1_H2 float NULL,
	N7_R6_T1 float NULL,
	N7_R6_H1 float NULL,
	N7_R6_T2 float NULL,
	N7_R6_H2 float NULL,
	N7_R11_T1 float NULL,
	N7_R11_H1 float NULL,
	N7_R11_T2 float NULL,
	N7_R11_H2 float NULL,
	N7_T1_Prom float NULL,
	N7_T2_Prom float NULL,
	CONSTRAINT PK__Registro__5ADE19332252ADDF PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_N8 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_N8;
CREATE TABLE [Edge DB].dbo.Registros_N8 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N8_Current_A_lado_A float NULL,
	N8_Current_Blado_A float NULL,
	N8_Current_C_lado_A float NULL,
	N8_Voltage_A_B_lado_A float NULL,
	N8_Voltage_B_C_lado_A float NULL,
	N8_Voltage_C_A_lado_A float NULL,
	N8_Active_Power_Total_lado_A float NULL,
	N8_Active_Energy_Received_Out_of_Load_lado_A float NULL,
	N8_Current_A_Lado_B float NULL,
	N8_Current_BLado_B float NULL,
	N8_Current_C_Lado_B float NULL,
	N8_Active_Power_Total_Lado_B float NULL,
	N8_Active_Energy_Received_Out_of_Load_Lado_B float NULL,
	N8_Power_Factor_lado_A float NULL,
	N8_Power_Factor_Lado_B float NULL,
	N8_Temperature_In float NULL,
	N8_Temperature_Out float NULL,
	N8_Pressure float NULL,
	N8_Flow float NULL,
	N8_Pump_Frecuency float NULL,
	N8_Pump_Velocity float NULL,
	N8_R1_T1 float NULL,
	N8_R1_H1 float NULL,
	N8_R1_T2 float NULL,
	N8_R1_H2 float NULL,
	N8_R6_T1 float NULL,
	N8_R6_H1 float NULL,
	N8_R6_T2 float NULL,
	N8_R6_H2 float NULL,
	N8_R11_T1 float NULL,
	N8_R11_H1 float NULL,
	N8_R11_T2 float NULL,
	N8_R11_H2 float NULL,
	N8_T1_Prom float NULL,
	N8_T2_Prom float NULL,
	CONSTRAINT PK__Registro__5ADE1933174ECF20 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_N9 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_N9;
CREATE TABLE [Edge DB].dbo.Registros_N9 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N9_Current_A_lado_A float NULL,
	N9_Current_Blado_A float NULL,
	N9_Current_C_lado_A float NULL,
	N9_Voltage_A_B_lado_A float NULL,
	N9_Voltage_B_C_lado_A float NULL,
	N9_Voltage_C_A_lado_A float NULL,
	N9_Active_Power_Total_lado_A float NULL,
	N9_Active_Energy_Received_Out_of_Load_lado_A float NULL,
	N9_Current_A_Lado_B float NULL,
	N9_Current_BLado_B float NULL,
	N9_Current_C_Lado_B float NULL,
	N9_Active_Power_Total_Lado_B float NULL,
	N9_Active_Energy_Received_Out_of_Load_Lado_B float NULL,
	N9_Power_Factor_lado_A float NULL,
	N9_Power_Factor_Lado_B float NULL,
	N9_Temperature_In float NULL,
	N9_Temperature_Out float NULL,
	N9_Pressure float NULL,
	N9_Flow float NULL,
	N9_Pump_Frecuency float NULL,
	N9_Pump_Velocity float NULL,
	N9_R1_T1 float NULL,
	N9_R1_H1 float NULL,
	N9_R1_T2 float NULL,
	N9_R1_H2 float NULL,
	N9_R6_T1 float NULL,
	N9_R6_H1 float NULL,
	N9_R6_T2 float NULL,
	N9_R6_H2 float NULL,
	N9_R11_T1 float NULL,
	N9_R11_H1 float NULL,
	N9_R11_T2 float NULL,
	N9_R11_H2 float NULL,
	N9_T1_Prom float NULL,
	N9_T2_Prom float NULL,
	CONSTRAINT PK__Registro__5ADE19330EDE3F19 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_ND_Tablero_Aux definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_ND_Tablero_Aux;
CREATE TABLE [Edge DB].dbo.Registros_ND_Tablero_Aux (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	ND_Active_Power_Total_Tablero_Aux float NULL,
	ND_Voltaje_Linea_L12_Tablero_Aux float NULL,
	ND_Voltaje_Linea_L23_Tablero_Aux float NULL,
	ND_Voltaje_Linea_L31_Tablero_Aux float NULL,
	ND_Corriente_A_Tablero_Aux float NULL,
	ND_Corriente_B_Tablero_Aux float NULL,
	ND_Corriente_C_Tablero_Aux float NULL,
	ND_Energia_Tablero_Aux float NULL,
	CONSTRAINT PK__Registro__5ADE1933D98B3C51 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_PUE_alimentadores definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_PUE_alimentadores;
CREATE TABLE [Edge DB].dbo.Registros_PUE_alimentadores (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	PUE_AL10_Baja float NULL,
	PUE_AL09_Baja float NULL,
	PUE_AL08_Baja float NULL,
	PUE_AL07_Baja float NULL,
	PUE_AL06_Baja float NULL,
	PUE_AL01_Baja float NULL,
	PUE_AltaBaja float NULL,
	PUE_AL02_Baja float NULL,
	PUE_AL03_Baja float NULL,
	PUE_AL04_Baja float NULL,
	PUE_AL05_Baja float NULL,
	PUE_AL11_Baja float NULL,
	PUE_AL12_Baja float NULL,
	PUE_AL13_Baja float NULL,
	PUE_AL14_Baja float NULL,
	PUE_AL15_Baja float NULL,
	PUE_BC02_Baja float NULL,
	CONSTRAINT PK__Registro__5ADE1933922DC96A PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_Pruebas_OC definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_Pruebas_OC;
CREATE TABLE [Edge DB].dbo.Registros_Pruebas_OC (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	MinerOC_01_IR float NULL,
	MinerOC_01_IS float NULL,
	MinerOC_01_IT float NULL,
	MinerOC_01_VRS float NULL,
	MinerOC_01_VST float NULL,
	MinerOC_01_VRT float NULL,
	MinerOC_01_W float NULL,
	MinerOC_02_IR float NULL,
	MinerOC_02_IS float NULL,
	MinerOC_02_IT float NULL,
	MinerOC_02_VRS float NULL,
	MinerOC_02_VST float NULL,
	MinerOC_02_VRT float NULL,
	MinerOC_02_W float NULL,
	MinerOC_03_IR float NULL,
	MinerOC_03_IS float NULL,
	MinerOC_03_IT float NULL,
	MinerOC_03_VRS float NULL,
	MinerOC_03_VST float NULL,
	MinerOC_03_VRT float NULL,
	MinerOC_03_W float NULL,
	CONSTRAINT PK__Registro__5ADE1933EB93640F PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_S1 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_S1;
CREATE TABLE [Edge DB].dbo.Registros_S1 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	S1_Potencia_Activa_Kw_lado_A float NULL,
	S1_Potencia_Activa_Kw_lado_B float NULL,
	S1_Energía_lado_A_Kwh float NULL,
	S1_Energía_lado_B_Kwh float NULL,
	S1_TT01 float NULL,
	S1_TT02 float NULL,
	S1_PT01 float NULL,
	S1_PT02 float NULL,
	S1_FT01 float NULL,
	S1_TRT01 float NULL,
	S1_TH01 int NULL,
	S1_Dew_Point_Temp int NULL,
	S1_Vab_lado_A int NULL,
	S1_Vbc_lado_A int NULL,
	S1_Vac_lado_A int NULL,
	S1_Iab_lado_A float NULL,
	S1_Ibc_lado_A float NULL,
	S1_Iac_lado_A float NULL,
	S1_Iab_lado_B float NULL,
	S1_Ibc_lado_B float NULL,
	S1_Iac_lado_B float NULL,
	S1_Factor_de_Potencia_lado_A float NULL,
	S1_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE19334E5663CE PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_S2 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_S2;
CREATE TABLE [Edge DB].dbo.Registros_S2 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	S2_Potencia_Activa_Kw_lado_A float NULL,
	S2_Potencia_Activa_Kw_lado_B float NULL,
	S2_Energía_lado_A_Kwh float NULL,
	S2_Energía_lado_B_Kwh float NULL,
	S2_TT01 float NULL,
	S2_TT02 float NULL,
	S2_PT01 float NULL,
	S2_PT02 float NULL,
	S2_FT01 float NULL,
	S2_TRT01 float NULL,
	S2_TH01 int NULL,
	S2_Dew_Point_Temp int NULL,
	S2_Vab_lado_A int NULL,
	S2_Vbc_lado_A int NULL,
	S2_Vac_lado_A int NULL,
	S2_Iab_lado_A float NULL,
	S2_Ibc_lado_A float NULL,
	S2_Iac_lado_A float NULL,
	S2_Iab_lado_B float NULL,
	S2_Ibc_lado_B float NULL,
	S2_Iac_lado_B float NULL,
	S2_Factor_de_Potencia_lado_A float NULL,
	S2_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE19332EC525D3 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_S3 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_S3;
CREATE TABLE [Edge DB].dbo.Registros_S3 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	S3_Potencia_Activa_Kw_lado_A float NULL,
	S3_Potencia_Activa_Kw_lado_B float NULL,
	S3_Energía_lado_A_Kwh float NULL,
	S3_Energía_lado_B_Kwh float NULL,
	S3_TT01 float NULL,
	S3_TT02 float NULL,
	S3_PT01 float NULL,
	S3_PT02 float NULL,
	S3_FT01 float NULL,
	S3_TRT01 float NULL,
	S3_TH01 int NULL,
	S3_Dew_Point_Temp int NULL,
	S3_Vab_lado_A int NULL,
	S3_Vbc_lado_A int NULL,
	S3_Vac_lado_A int NULL,
	S3_Iab_lado_A float NULL,
	S3_Ibc_lado_A float NULL,
	S3_Iac_lado_A float NULL,
	S3_Iab_lado_B float NULL,
	S3_Ibc_lado_B float NULL,
	S3_Iac_lado_B float NULL,
	S3_Factor_de_Potencia_lado_A float NULL,
	S3_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE193363980259 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_S4 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_S4;
CREATE TABLE [Edge DB].dbo.Registros_S4 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	S4_Potencia_Activa_Kw_lado_A float NULL,
	S4_Potencia_Activa_Kw_lado_B float NULL,
	S4_Energía_lado_A_Kwh float NULL,
	S4_Energía_lado_B_Kwh float NULL,
	S4_TT01 float NULL,
	S4_TT02 float NULL,
	S4_PT01 float NULL,
	S4_PT02 float NULL,
	S4_FT01 float NULL,
	S4_TRT01 float NULL,
	S4_TH01 int NULL,
	S4_Dew_Point_Temp int NULL,
	S4_Vab_lado_A int NULL,
	S4_Vbc_lado_A int NULL,
	S4_Vac_lado_A int NULL,
	S4_Iab_lado_A float NULL,
	S4_Ibc_lado_A float NULL,
	S4_Iac_lado_A float NULL,
	S4_Iab_lado_B float NULL,
	S4_Ibc_lado_B float NULL,
	S4_Iac_lado_B float NULL,
	S4_Factor_de_Potencia_lado_A float NULL,
	S4_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE19334EE36DD5 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_S5 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_S5;
CREATE TABLE [Edge DB].dbo.Registros_S5 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	S5_Potencia_Activa_Kw_lado_A float NULL,
	S5_Potencia_Activa_Kw_lado_B float NULL,
	S5_Energía_lado_A_Kwh float NULL,
	S5_Energía_lado_B_Kwh float NULL,
	S5_TT01 float NULL,
	S5_TT02 float NULL,
	S5_PT01 float NULL,
	S5_PT02 float NULL,
	S5_FT01 float NULL,
	S5_TRT01 float NULL,
	S5_TH01 int NULL,
	S5_Dew_Point_Temp int NULL,
	S5_Vab_lado_A int NULL,
	S5_Vbc_lado_A int NULL,
	S5_Vac_lado_A int NULL,
	S5_Iab_lado_A float NULL,
	S5_Ibc_lado_A float NULL,
	S5_Iac_lado_A float NULL,
	S5_Iab_lado_B float NULL,
	S5_Ibc_lado_B float NULL,
	S5_Iac_lado_B float NULL,
	S5_Factor_de_Potencia_lado_A float NULL,
	S5_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE1933020C4E4B PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_S6 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_S6;
CREATE TABLE [Edge DB].dbo.Registros_S6 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	S6_Potencia_Activa_Kw_lado_A float NULL,
	S6_Potencia_Activa_Kw_lado_B float NULL,
	S6_Energía_lado_A_Kwh float NULL,
	S6_Energía_lado_B_Kwh float NULL,
	S6_TT01 float NULL,
	S6_TT02 float NULL,
	S6_PT01 float NULL,
	S6_PT02 float NULL,
	S6_FT01 float NULL,
	S6_TRT01 float NULL,
	S6_TH01 int NULL,
	S6_Dew_Point_Temp int NULL,
	S6_Vab_lado_A int NULL,
	S6_Vbc_lado_A int NULL,
	S6_Vac_lado_A int NULL,
	S6_Iab_lado_A float NULL,
	S6_Ibc_lado_A float NULL,
	S6_Iac_lado_A float NULL,
	S6_Iab_lado_B float NULL,
	S6_Ibc_lado_B float NULL,
	S6_Iac_lado_B float NULL,
	S6_Factor_de_Potencia_lado_A float NULL,
	S6_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE1933067133A5 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_S7 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_S7;
CREATE TABLE [Edge DB].dbo.Registros_S7 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	S7_Potencia_Activa_Kw_lado_A float NULL,
	S7_Potencia_Activa_Kw_lado_B float NULL,
	S7_Energía_lado_A_Kwh float NULL,
	S7_Energía_lado_B_Kwh float NULL,
	S7_TT01 float NULL,
	S7_TT02 float NULL,
	S7_PT01 float NULL,
	S7_PT02 float NULL,
	S7_FT01 float NULL,
	S7_TRT01 float NULL,
	S7_TH01 int NULL,
	S7_Dew_Point_Temp int NULL,
	S7_Vab_lado_A int NULL,
	S7_Vbc_lado_A int NULL,
	S7_Vac_lado_A int NULL,
	S7_Iab_lado_A float NULL,
	S7_Ibc_lado_A float NULL,
	S7_Iac_lado_A float NULL,
	S7_Iab_lado_B float NULL,
	S7_Ibc_lado_B float NULL,
	S7_Iac_lado_B float NULL,
	S7_Factor_de_Potencia_lado_A float NULL,
	S7_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE193399E13E5D PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_S8 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_S8;
CREATE TABLE [Edge DB].dbo.Registros_S8 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	S8_Potencia_Activa_Kw_lado_A float NULL,
	S8_Potencia_Activa_Kw_lado_B float NULL,
	S8_Energía_lado_A_Kwh float NULL,
	S8_Energía_lado_B_Kwh float NULL,
	S8_TT01 float NULL,
	S8_TT02 float NULL,
	S8_PT01 float NULL,
	S8_PT02 float NULL,
	S8_FT01 float NULL,
	S8_TRT01 float NULL,
	S8_TH01 int NULL,
	S8_Dew_Point_Temp int NULL,
	S8_Vab_lado_A int NULL,
	S8_Vbc_lado_A int NULL,
	S8_Vac_lado_A int NULL,
	S8_Iab_lado_A float NULL,
	S8_Ibc_lado_A float NULL,
	S8_Iac_lado_A float NULL,
	S8_Iab_lado_B float NULL,
	S8_Ibc_lado_B float NULL,
	S8_Iac_lado_B float NULL,
	S8_Factor_de_Potencia_lado_A float NULL,
	S8_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE1933FE2E1904 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_S9 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_S9;
CREATE TABLE [Edge DB].dbo.Registros_S9 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	S9_Potencia_Activa_Kw_lado_A float NULL,
	S9_Potencia_Activa_Kw_lado_B float NULL,
	S9_Energía_lado_A_Kwh float NULL,
	S9_Energía_lado_B_Kwh float NULL,
	S9_TT01 float NULL,
	S9_TT02 float NULL,
	S9_PT01 float NULL,
	S9_PT02 float NULL,
	S9_FT01 float NULL,
	S9_TRT01 float NULL,
	S9_TH01 int NULL,
	S9_Dew_Point_Temp int NULL,
	S9_Vab_lado_A int NULL,
	S9_Vbc_lado_A int NULL,
	S9_Vac_lado_A int NULL,
	S9_Iab_lado_A float NULL,
	S9_Ibc_lado_A float NULL,
	S9_Iac_lado_A float NULL,
	S9_Iab_lado_B float NULL,
	S9_Ibc_lado_B float NULL,
	S9_Iac_lado_B float NULL,
	S9_Factor_de_Potencia_lado_A float NULL,
	S9_Factor_de_Potencia_lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE1933330B79D9 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_T11 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_T11;
CREATE TABLE [Edge DB].dbo.Registros_T11 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	T11_Active_Power_Total_lado_A float NULL,
	T11_Active_Energy_Received_Out_of_Load_lado_A float NULL,
	T11_Active_Power_Total_Lado_B float NULL,
	T11_Active_Energy_Received_Out_of_Load_Lado_B float NULL,
	T11_Current_A_lado_A float NULL,
	T11_Current_Blado_A float NULL,
	T11_Current_C_lado_A float NULL,
	T11_Voltage_A_N_lado_A float NULL,
	T11_Voltage_B_N_lado_A float NULL,
	T11_Voltage_C_N_lado_A float NULL,
	T11_Current_A_Lado_B float NULL,
	T11_Current_BLado_B float NULL,
	T11_Current_C_Lado_B float NULL,
	T11_Power_Factor_lado_A float NULL,
	T11_Power_Factor_Lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE1933BAF9AFAE PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_T12 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_T12;
CREATE TABLE [Edge DB].dbo.Registros_T12 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	T12_Active_Power_Total_lado_A float NULL,
	T12_Active_Energy_Received_Out_of_Load_lado_A float NULL,
	T12_Active_Power_Total_Lado_B float NULL,
	T12_Active_Energy_Received_Out_of_Load_Lado_B float NULL,
	T12_Current_A_lado_A float NULL,
	T12_Current_Blado_A float NULL,
	T12_Current_C_lado_A float NULL,
	T12_Voltage_A_N_lado_A float NULL,
	T12_Voltage_B_N_lado_A float NULL,
	T12_Voltage_C_N_lado_A float NULL,
	T12_Current_A_Lado_B float NULL,
	T12_Current_BLado_B float NULL,
	T12_Current_C_Lado_B float NULL,
	T12_Power_Factor_lado_A float NULL,
	T12_Power_Factor_Lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE193396E10467 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_T21 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_T21;
CREATE TABLE [Edge DB].dbo.Registros_T21 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	T21_Active_Power_Total_lado_A float NULL,
	T21_Active_Energy_Received_Out_of_Load_lado_A float NULL,
	T21_Active_Power_Total_Lado_B float NULL,
	T21_Active_Energy_Received_Out_of_Load_Lado_B float NULL,
	T21_Current_A_lado_A float NULL,
	T21_Current_Blado_A float NULL,
	T21_Current_C_lado_A float NULL,
	T21_Voltage_A_N_lado_A float NULL,
	T21_Voltage_B_N_lado_A float NULL,
	T21_Voltage_C_N_lado_A float NULL,
	T21_Current_A_Lado_B float NULL,
	T21_Current_BLado_B float NULL,
	T21_Current_C_Lado_B float NULL,
	T21_Power_Factor_lado_A float NULL,
	T21_Power_Factor_Lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE193301498903 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_T22 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_T22;
CREATE TABLE [Edge DB].dbo.Registros_T22 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	T22_Active_Power_Total_lado_A float NULL,
	T22_Active_Energy_Received_Out_of_Load_lado_A float NULL,
	T22_Active_Power_Total_Lado_B float NULL,
	T22_Active_Energy_Received_Out_of_Load_Lado_B float NULL,
	T22_Current_A_lado_A float NULL,
	T22_Current_Blado_A float NULL,
	T22_Current_C_lado_A float NULL,
	T22_Voltage_A_N_lado_A float NULL,
	T22_Voltage_B_N_lado_A float NULL,
	T22_Voltage_C_N_lado_A float NULL,
	T22_Current_A_Lado_B float NULL,
	T22_Current_BLado_B float NULL,
	T22_Current_C_Lado_B float NULL,
	T22_Power_Factor_lado_A float NULL,
	T22_Power_Factor_Lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE193332B32D53 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_T31 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_T31;
CREATE TABLE [Edge DB].dbo.Registros_T31 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	T31_Active_Power_Total_lado_A float NULL,
	T31_Active_Energy_Received_Out_of_Load_lado_A float NULL,
	T31_Active_Power_Total_Lado_B float NULL,
	T31_Active_Energy_Received_Out_of_Load_Lado_B float NULL,
	T31_Current_A_lado_A float NULL,
	T31_Current_Blado_A float NULL,
	T31_Current_C_lado_A float NULL,
	T31_Voltage_A_N_lado_A float NULL,
	T31_Voltage_B_N_lado_A float NULL,
	T31_Voltage_C_N_lado_A float NULL,
	T31_Current_A_Lado_B float NULL,
	T31_Current_BLado_B float NULL,
	T31_Current_C_Lado_B float NULL,
	T31_Power_Factor_lado_A float NULL,
	T31_Power_Factor_Lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE1933D538CF19 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_T32 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_T32;
CREATE TABLE [Edge DB].dbo.Registros_T32 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	T32_Active_Power_Total_lado_A float NULL,
	T32_Active_Energy_Received_Out_of_Load_lado_A float NULL,
	T32_Active_Power_Total_Lado_B float NULL,
	T32_Active_Energy_Received_Out_of_Load_Lado_B float NULL,
	T32_Current_A_lado_A float NULL,
	T32_Current_Blado_A float NULL,
	T32_Current_C_lado_A float NULL,
	T32_Voltage_A_N_lado_A float NULL,
	T32_Voltage_B_N_lado_A float NULL,
	T32_Voltage_C_N_lado_A float NULL,
	T32_Current_A_Lado_B float NULL,
	T32_Current_BLado_B float NULL,
	T32_Current_C_Lado_B float NULL,
	T32_Power_Factor_lado_A float NULL,
	T32_Power_Factor_Lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE193315D2CF33 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_T41 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_T41;
CREATE TABLE [Edge DB].dbo.Registros_T41 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	T41_Active_Power_Total_lado_A float NULL,
	T41_Active_Energy_Received_Out_of_Load_lado_A float NULL,
	T41_Active_Power_Total_Lado_B float NULL,
	T41_Active_Energy_Received_Out_of_Load_Lado_B float NULL,
	T41_Current_A_lado_A float NULL,
	T41_Current_Blado_A float NULL,
	T41_Current_C_lado_A float NULL,
	T41_Voltage_A_N_lado_A float NULL,
	T41_Voltage_B_N_lado_A float NULL,
	T41_Voltage_C_N_lado_A float NULL,
	T41_Current_A_Lado_B float NULL,
	T41_Current_BLado_B float NULL,
	T41_Current_C_Lado_B float NULL,
	T41_Power_Factor_lado_A float NULL,
	T41_Power_Factor_Lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE1933505877C9 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_T42 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_T42;
CREATE TABLE [Edge DB].dbo.Registros_T42 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	T42_Active_Power_Total_lado_A float NULL,
	T42_Active_Energy_Received_Out_of_Load_lado_A float NULL,
	T42_Active_Power_Total_Lado_B float NULL,
	T42_Active_Energy_Received_Out_of_Load_Lado_B float NULL,
	T42_Current_A_lado_A float NULL,
	T42_Current_Blado_A float NULL,
	T42_Current_C_lado_A float NULL,
	T42_Voltage_A_N_lado_A float NULL,
	T42_Voltage_B_N_lado_A float NULL,
	T42_Voltage_C_N_lado_A float NULL,
	T42_Current_A_Lado_B float NULL,
	T42_Current_BLado_B float NULL,
	T42_Current_C_Lado_B float NULL,
	T42_Power_Factor_lado_A float NULL,
	T42_Power_Factor_Lado_B float NULL,
	CONSTRAINT PK__Registro__5ADE19332EA9D6F5 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_TR_1 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_TR_1;
CREATE TABLE [Edge DB].dbo.Registros_TR_1 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	Trafo1_Total_Power float NULL,
	Trafo1_Voltaje_RS int NULL,
	Trafo1_Voltaje_ST int NULL,
	Trafo1_Voltaje_TR int NULL,
	Trafo1_Corriente_IR int NULL,
	Trafo1_Corriente_IS int NULL,
	Trafo1_Corriente_IT int NULL,
	Trafo1_FP int NULL,
	Trafo1_Frecuencia int NULL,
	Trafo1_Energia int NULL,
	CONSTRAINT PK__Registro__5ADE1933D4D31570 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_TR_2 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_TR_2;
CREATE TABLE [Edge DB].dbo.Registros_TR_2 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	Trafo2_Total_Power float NULL,
	Trafo2_Energia int NULL,
	Trafo2_Voltaje_RS int NULL,
	Trafo2_Voltaje_ST int NULL,
	Trafo2_Voltaje_TR int NULL,
	Trafo2_Corriente_IR int NULL,
	Trafo2_Corriente_IS int NULL,
	Trafo2_Corriente_IT int NULL,
	Trafo2_FP int NULL,
	Trafo2_Frecuencia int NULL,
	CONSTRAINT PK__Registro__5ADE1933697DBE94 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_TR_3 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_TR_3;
CREATE TABLE [Edge DB].dbo.Registros_TR_3 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	Trafo3_Total_Power float NULL,
	Trafo3_Energia int NULL,
	Trafo3_Voltaje_RS int NULL,
	Trafo3_Voltaje_ST int NULL,
	Trafo3_Voltaje_TR int NULL,
	Trafo3_Corriente_IR int NULL,
	Trafo3_Corriente_IS int NULL,
	Trafo3_Corriente_IT int NULL,
	Trafo3_FP int NULL,
	Trafo3_Frecuencia int NULL,
	CONSTRAINT PK__Registro__5ADE1933CD758782 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_Tablero_Movil_Consumo definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_Tablero_Movil_Consumo;
CREATE TABLE [Edge DB].dbo.Registros_Tablero_Movil_Consumo (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	Medicion_Consumo_Movil_RS float NULL,
	Medicion_Consumo_Movil_ST float NULL,
	Medicion_Consumo_Movil_TR float NULL,
	Medicion_Consumo_Movil_IR float NULL,
	Medicion_Consumo_Movil_IS float NULL,
	Medicion_Consumo_Movil_IT float NULL,
	Medicion_Consumo_Movil_Kw float NULL,
	Medicion_Consumo_Movil_Energia float NULL,
	Temp_In_Immersion float NULL,
	Temp_Out_Immersion float NULL,
	Medicion_Consumo_Movil_PA_Kw float NULL,
	Medicion_Consumo_Movil_PB_Kw float NULL,
	Medicion_Consumo_Movil_PC_Kw float NULL,
	CONSTRAINT PK__Registro__5ADE193316AA9932 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_Z1 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_Z1;
CREATE TABLE [Edge DB].dbo.Registros_Z1 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	Z1_Current_A_lado_A1 float NULL,
	Z1_Current_B_lado_A1 float NULL,
	Z1_Current_C_lado_A1 float NULL,
	Z1_Voltage_A_B_lado_A1 float NULL,
	Z1_Voltage_B_C_lado_A1 float NULL,
	Z1_Voltage_C_A_lado_A1 float NULL,
	Z1_Active_Power_Total_lado_A1 float NULL,
	Z1_Active_Energy_Received_Out_of_Load_lado_A1 float NULL,
	Z1_Current_A_lado_A2 float NULL,
	Z1_Current_B_lado_A2 float NULL,
	Z1_Current_C_lado_A2 float NULL,
	Z1_Active_Power_Total_lado_A2 float NULL,
	Z1_Active_Energy_Received_Out_of_Load_lado_A2 float NULL,
	Z1_Current_A_lado_B1 float NULL,
	Z1_Current_B_lado_B1 float NULL,
	Z1_Current_C_lado_B1 float NULL,
	Z1_Active_Power_Total_lado_B1 float NULL,
	Z1_Active_Energy_Received_Out_of_Load_lado_B1 float NULL,
	Z1_Current_A_lado_B2 float NULL,
	Z1_Current_B_lado_B2 float NULL,
	Z1_Current_C_lado_B2 float NULL,
	Z1_Active_Power_Total_lado_B2 float NULL,
	Z1_Active_Energy_Received_Out_of_Load_lado_B2 float NULL,
	Z1_Active_Energy_Delivered_Into_Load_lado_A1 float NULL,
	Z1_Active_Energy_Delivered_Into_Load_lado_A2 float NULL,
	Z1_Active_Energy_Delivered_Into_Load_lado_B1 float NULL,
	Z1_Active_Energy_Delivered_Into_Load_lado_B2 float NULL,
	CONSTRAINT PK__Registro__5ADE19338F17DB55 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_Z2 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_Z2;
CREATE TABLE [Edge DB].dbo.Registros_Z2 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	Z2_Current_A_lado_A1 float NULL,
	Z2_Current_B_lado_A1 float NULL,
	Z2_Current_C_lado_A1 float NULL,
	Z2_Voltage_A_B_lado_A1 float NULL,
	Z2_Voltage_B_C_lado_A1 float NULL,
	Z2_Voltage_C_A_lado_A1 float NULL,
	Z2_Active_Power_Total_lado_A1 float NULL,
	Z2_Active_Energy_Received_Out_of_Load_lado_A1 float NULL,
	Z2_Current_A_lado_A2 float NULL,
	Z2_Current_B_lado_A2 float NULL,
	Z2_Current_C_lado_A2 float NULL,
	Z2_Active_Power_Total_lado_A2 float NULL,
	Z2_Active_Energy_Received_Out_of_Load_lado_A2 float NULL,
	Z2_Current_A_lado_B1 float NULL,
	Z2_Current_B_lado_B1 float NULL,
	Z2_Current_C_lado_B1 float NULL,
	Z2_Active_Power_Total_lado_B1 float NULL,
	Z2_Active_Energy_Received_Out_of_Load_lado_B1 float NULL,
	Z2_Current_A_lado_B2 float NULL,
	Z2_Current_B_lado_B2 float NULL,
	Z2_Current_C_lado_B2 float NULL,
	Z2_Active_Power_Total_lado_B2 float NULL,
	Z2_Active_Energy_Received_Out_of_Load_lado_B2 float NULL,
	Z2_Active_Energy_Delivered_Into_Load_lado_A1 float NULL,
	Z2_Active_Energy_Delivered_Into_Load_lado_A2 float NULL,
	Z2_Active_Energy_Delivered_Into_Load_lado_B1 float NULL,
	Z2_Active_Energy_Delivered_Into_Load_lado_B2 float NULL,
	CONSTRAINT PK__Registro__5ADE1933619931DE PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Registros_Z3 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Registros_Z3;
CREATE TABLE [Edge DB].dbo.Registros_Z3 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	Z3_Current_A_lado_A1 float NULL,
	Z3_Current_B_lado_A1 float NULL,
	Z3_Current_C_lado_A1 float NULL,
	Z3_Voltage_A_B_lado_A1 float NULL,
	Z3_Voltage_B_C_lado_A1 float NULL,
	Z3_Voltage_C_A_lado_A1 float NULL,
	Z3_Active_Power_Total_lado_A1 float NULL,
	Z3_Active_Energy_Delivered_Into_Load_lado_A1 float NULL,
	Z3_Current_A_lado_A2 float NULL,
	Z3_Current_B_lado_A2 float NULL,
	Z3_Current_C_lado_A2 float NULL,
	Z3_Active_Power_Total_lado_A2 float NULL,
	Z3_Active_Energy_Delivered_Into_Load_lado_A2 float NULL,
	Z3_Current_A_lado_B1 float NULL,
	Z3_Current_B_lado_B1 float NULL,
	Z3_Current_C_lado_B1 float NULL,
	Z3_Active_Power_Total_lado_B1 float NULL,
	Z3_Active_Energy_Delivered_Into_Load_lado_B1 float NULL,
	Z3_Current_A_lado_B2 float NULL,
	Z3_Current_B_lado_B2 float NULL,
	Z3_Current_C_lado_B2 float NULL,
	Z3_Active_Power_Total_lado_B2 float NULL,
	Z3_Active_Energy_Delivered_Into_Load_lado_B2 float NULL,
	CONSTRAINT PK__Registro__5ADE193337FA7713 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.TempTrafoABCD definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.TempTrafoABCD;
CREATE TABLE [Edge DB].dbo.TempTrafoABCD (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	A2_Temperatura_Transformador int NULL,
	A3_Temperatura_Transformador int NULL,
	A1_Temperatura_Transformador int NULL,
	B1_Temperatura_Transformador int NULL,
	B2_Temperatura_Transformador int NULL,
	B3_Temperatura_Transformador int NULL,
	C1_Temperatura_Transformador int NULL,
	C2_Temperatura_Transformador int NULL,
	C3_Temperatura_Transformador int NULL,
	D1_Temperatura_Transformador int NULL,
	D2_Temperatura_Transformador int NULL,
	D3_Temperatura_Transformador int NULL,
	F1_Temperatura_Transformador int NULL,
	F2_Temperatura_Transformador int NULL,
	F3_Temperatura_Transformador int NULL,
	G1_Temperatura_Transformador int NULL,
	G2_Temperatura_Transformador int NULL,
	CONSTRAINT PK__TempTraf__5ADE19335CEE1EDA PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.TempTrafoMara2 definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.TempTrafoMara2;
CREATE TABLE [Edge DB].dbo.TempTrafoMara2 (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	M1_Temperatura_Transformador float NULL,
	M2_Temperatura_Transformador float NULL,
	M3_Temperatura_Transformador float NULL,
	M4_Temperatura_Transformador float NULL,
	M5_Temperatura_Transformador float NULL,
	M6_Temperatura_Transformador float NULL,
	M7_Temperatura_Transformador float NULL,
	M8_Temperatura_Transformador float NULL,
	M9_Temperatura_Transformador float NULL,
	M10_Temperatura_Transformador float NULL,
	CONSTRAINT PK__TempTraf__5ADE1933B87FF675 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.TempTranfoN definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.TempTranfoN;
CREATE TABLE [Edge DB].dbo.TempTranfoN (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	N1_Temperatura_Transformador float NULL,
	N1_2_Temperatura_Transformador float NULL,
	N2_Temperatura_Transformador float NULL,
	N3_Temperatura_Transformador float NULL,
	N4_Temperatura_Transformador float NULL,
	N5_Temperatura_Transformador float NULL,
	N6_Temperatura_Transformador float NULL,
	N3_C_Temperatura_Transformador float NULL,
	N7_Temperatura_Transformador float NULL,
	N8_Temperatura_Transformador float NULL,
	N9_Temperatura_Transformador float NULL,
	N10_Temperatura_Transformador float NULL,
	N11_Temperatura_Transformador float NULL,
	N12_Temperatura_Transformador float NULL,
	CONSTRAINT PK__TempTran__5ADE1933E7BC86B9 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Temp_Trafos_SM definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Temp_Trafos_SM;
CREATE TABLE [Edge DB].dbo.Temp_Trafos_SM (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	S1_S2_Temperatura_Transformador float NULL,
	S3_Temperatura_Transformador float NULL,
	S4_Temperatura_Transformador float NULL,
	S5_Temperatura_Transformador float NULL,
	S6_Temperatura_Transformador float NULL,
	S7_Temperatura_Transformador float NULL,
	S8_Temperatura_Transformador float NULL,
	S9_Temperatura_Transformador float NULL,
	CONSTRAINT PK__Temp_Tra__5ADE19336EA22B86 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Temp_Trafos_Texas definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Temp_Trafos_Texas;
CREATE TABLE [Edge DB].dbo.Temp_Trafos_Texas (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	T11_T12_Temperatura_Transformador float NULL,
	T21_T22_Temperatura_Transformador float NULL,
	T31_T32_Temperatura_Transformador float NULL,
	T41_T42_Temperatura_Transformador float NULL,
	CONSTRAINT PK__Temp_Tra__5ADE19334A9E8851 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Temp_Trafos_Villarrica definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Temp_Trafos_Villarrica;
CREATE TABLE [Edge DB].dbo.Temp_Trafos_Villarrica (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	E11_Temperatura_Transformador float NULL,
	E12_Temperatura_Transformador float NULL,
	E21_Temperatura_Transformador float NULL,
	E22_Temperatura_Transformador float NULL,
	E31_Temperatura_Transformador float NULL,
	E32_Temperatura_Transformador float NULL,
	CONSTRAINT PK__Temp_Tra__5ADE193359B96DC5 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Temp_Trafos_Zas definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Temp_Trafos_Zas;
CREATE TABLE [Edge DB].dbo.Temp_Trafos_Zas (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	Z1_Temperatura_Transformador float NULL,
	Z2_Temperatura_Transformador float NULL,
	Z3_Temperatura_Transformador float NULL,
	CONSTRAINT PK__Temp_Tra__5ADE193348F04314 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.Voltage_Trends definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.Voltage_Trends;
CREATE TABLE [Edge DB].dbo.Voltage_Trends (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	A11_Vab_lado_A float NULL,
	A11_Vbc_lado_A float NULL,
	A11_Vac_lado_A float NULL,
	A11_Iab_lado_A int NULL,
	A11_Ibc_lado_A int NULL,
	A11_Iac_lado_A int NULL,
	A12_Vab_lado_A float NULL,
	A12_Vbc_lado_A float NULL,
	A12_Vac_lado_A float NULL,
	A12_Iab_lado_A int NULL,
	A12_Ibc_lado_A int NULL,
	A12_Iac_lado_A int NULL,
	PQM_Voltaje_A_B_Primario float NULL,
	PQM_Voltaje_B_C_Primario float NULL,
	PQM_Voltaje_C_A_Primario float NULL,
	PQM_Corriente_A_Primario float NULL,
	PQM_Corriente_B_Primario float NULL,
	PQM_Corriente_C_Primario float NULL,
	CONSTRAINT PK__Voltage___5ADE1933DCDCFCDC PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.clients_hashrate definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.clients_hashrate;
CREATE TABLE [Edge DB].dbo.clients_hashrate (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	A11_hashrate float NULL,
	A12_hashrate float NULL,
	A21_hashrate float NULL,
	A22_hashrate float NULL,
	A31_hashrate float NULL,
	A32_hashrate float NULL,
	B11_hashrate float NULL,
	B12_hashrate float NULL,
	B21_hashrate float NULL,
	B22_hashrate float NULL,
	B31_hashrate float NULL,
	B32_hashrate float NULL,
	C11_hashrate float NULL,
	C12_hashrate float NULL,
	C21_hashrate float NULL,
	C22_hashrate float NULL,
	C31_hashrate float NULL,
	C32_hashrate float NULL,
	D11_hashrate float NULL,
	D12_hashrate float NULL,
	D21_hashrate float NULL,
	E11_hashrate float NULL,
	E12_hashrate float NULL,
	E21_hashrate float NULL,
	E22_hashrate float NULL,
	E31_hashrate float NULL,
	E32_hashrate float NULL,
	T11_hashrate float NULL,
	T12_hashrate float NULL,
	T21_hashrate float NULL,
	T22_hashrate float NULL,
	T31_hashrate float NULL,
	T32_hashrate float NULL,
	T41_hashrate float NULL,
	T42_hashrate float NULL,
	S1_hashrate float NULL,
	S2_hashrate float NULL,
	S3_hashrate float NULL,
	S4_hashrate float NULL,
	S5_hashrate float NULL,
	S6_hashrate float NULL,
	S7_hashrate float NULL,
	S8_hashrate float NULL,
	S9_hashrate float NULL,
	D31_hashrate float NULL,
	D32_hashrate float NULL,
	F11_hashrate float NULL,
	F12_hashrate float NULL,
	F21_hashrate float NULL,
	F22_hashrate float NULL,
	F31_hashrate float NULL,
	F32_hashrate float NULL,
	G11_hashrate float NULL,
	G12_hashrate float NULL,
	G21_hashrate float NULL,
	G22_hashrate float NULL,
	CONSTRAINT PK__clients___5ADE193302506F6F PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.clients_total_power definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.clients_total_power;
CREATE TABLE [Edge DB].dbo.clients_total_power (
	Time_Stamp datetime2 NOT NULL,
	Time_Stamp_ms int NOT NULL,
	ZP float NULL,
	Mara1 float NULL,
	Amity float NULL,
	Guy float NULL,
	Thomas float NULL,
	MiningPy float NULL,
	Axxa int NULL,
	Mara2 int NULL,
	ND int NULL,
	Sazmining float NULL,
	Saz_Hydro float NULL,
	Saz_Fan float NULL,
	CONSTRAINT PK__clients___5ADE19337B18BEF5 PRIMARY KEY (Time_Stamp,Time_Stamp_ms)
);
-- [Edge DB].dbo.sysdiagrams definition
-- Drop table
-- DROP TABLE [Edge DB].dbo.sysdiagrams;
CREATE TABLE [Edge DB].dbo.sysdiagrams (
	name sysname COLLATE Modern_Spanish_CI_AS NOT NULL,
	principal_id int NOT NULL,
	diagram_id int IDENTITY(1,1) NOT NULL,
	version int NULL,
	definition varbinary(MAX) NULL,
	CONSTRAINT PK__sysdiagr__C2B05B617E8EFCAB PRIMARY KEY (diagram_id),
	CONSTRAINT UK_principal_name UNIQUE (principal_id,name)
);