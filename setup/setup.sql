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
end
