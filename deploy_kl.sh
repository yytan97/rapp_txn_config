
targetDir="/kempas/www/rapp_configuration"



echo $targetDir
sftp -P 2100 cranium@211.24.83.110 << END

lpwd

cd $targetDir
pwd

put -R build/* .

END

echo "End of deployment"
