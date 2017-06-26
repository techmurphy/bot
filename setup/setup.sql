DROP PROCEDURE IF EXISTS insertmission
GO

create procedure dbo.insertmission(@mission nvarchar(max))
as begin
	insert into mission
	select *
	from OPENJSON(@mission,'$."CurrentMission"') 
			WITH (	MissionId varchar(150),
				ExpertOktaUsername varchar(200),
				MissionHostCountry varchar(100),
				MissionOrganizationName varchar(15),
				MissionName varchar(100),
				MissionAreaOfExpertiseCategory varchar(100),
				MissionAreaOfExpertise varchar(150),
				MissionStartDate date,
				MissionEndDate date,
				MissionRoster varchar(150),
				MissionResponsibleAdviserOktaUserName varchar(200))
	
	insert into mission
	select *
	from OPENJSON (@mission,'$."CurrentMission"."OtherMissions"')
			WITH (	MissionId varchar(150) '$.MissionId',
				ExpertOktaUsername varchar(200) '$.ExpertOktaUsername',
				MissionHostCountry varchar(100) '$.MissionHostCountry',
				MissionOrganizationName varchar(15) '$.MissionOrganizationName',
				MissionName varchar(100) '$.MissionName',
				MissionAreaOfExpertiseCategory varchar(100) '$.MissionAreaOfExpertiseCategory',
				MissionAreaOfExpertise varchar(150) '$.MissionAreaOfExpertise',
				MissionStartDate date '$.MissionStartDate',
				MissionEndDate date '$.MissionEndDate',
				MissionRoster varchar(150) '$.MissionRoster',
				MissionResponsibleAdviserOktaUserName varchar(200) '$.MissionResponsibleAdviserOktaUserName')
end
