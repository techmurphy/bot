DROP PROCEDURE IF EXISTS insertmission
GO

create procedure dbo.insertmission(@mission nvarchar(max))
as begin
	insert into mission
	select *
	from OPENJSON(@mission,'$."CurrentMission"') 
			WITH (	missionid varchar(150),
				exportoktausername varchar(200),
				missionhostcountry varchar(100),
				missionorganizationname varchar(15),
				missionname varchar(100),
				missionareaofexpertisecategory varchar(100),
				missionareaofexpertise varchar(150),
				missionstartdate date,
				missionenddate date,
				missionroster varchar(150),
				missionresponsibleadvisoroktausername varchar(200))
end
